import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Card from './common/Card';
import Modal from './common/Modal';
import ConfirmationModal from './common/ConfirmationModal';
import { useData } from '../hooks/useDataContext';
import { useCurrency } from '../hooks/useCurrencyContext';
import { PlusCircle, Trash2, Edit, Plus, X, XCircle, Search, GripVertical, CheckCircle, TrendingUp, ChevronDown, ChevronUp, Lightbulb, Copy, FileText, Save, ListChecks, Edit3, UploadCloud, Loader2, Weight } from 'lucide-react';
import { Recipe, Ingredient, RecipeCategory, RecipeTemplate, IngredientUnit } from '../types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const DEFAULT_UNITS: string[] = ['kg', 'g', 'L', 'ml', 'unit', 'dozen'];

// Sub-components for Modals to keep main component cleaner
const RecipeFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (recipe: Omit<Recipe, 'id' | 'businessId'>) => void;
    categories: RecipeCategory[];
    templates: RecipeTemplate[];
}> = ({ isOpen, onClose, onSave, categories, templates }) => {
    const { inventory, getInventoryItemById, getConversionFactor, ingredientUnits } = useData();
    const { formatCurrency } = useCurrency();
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [servings, setServings] = useState(1);
    const [targetSalePricePerServing, setTargetSalePrice] = useState(0);
    const [instructions, setInstructions] = useState('');
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    
    const allUnits = useMemo(() => {
        return [...new Set([...DEFAULT_UNITS, ...ingredientUnits.map(u => u.name)])]
    }, [ingredientUnits]);

    const recipeCost = useMemo(() => {
        return ingredients.reduce((total, ingredient) => {
            const item = getInventoryItemById(ingredient.itemId);
            if (!item) return total;
            const conversionFactor = getConversionFactor(ingredient.unit, item.unit) || 1;
            return total + (item.unitCost * ingredient.quantity * conversionFactor);
        }, 0);
    }, [ingredients, getInventoryItemById, getConversionFactor]);

    const costPerServing = servings > 0 ? recipeCost / servings : 0;
    const suggestedPrice = costPerServing > 0 ? costPerServing / 0.30 : 0; // Standard 30% food cost target

    const resetForm = useCallback(() => {
        setName('');
        setCategory(categories.length > 0 ? categories[0].name : '');
        setServings(1);
        setTargetSalePrice(0);
        setInstructions('');
        setIngredients([]);
        setErrors({});
    }, [categories]);

    useEffect(() => {
        if(isOpen) resetForm();
    }, [isOpen, resetForm]);

    const handleTemplateSelect = (templateId: string) => {
        const template = templates.find(t => t.id === templateId);
        if (!template) {
            resetForm();
            return;
        };
        const { recipeData } = template;
        setName(''); // Keep name blank for user to fill
        setCategory(recipeData.category);
        setServings(recipeData.servings);
        setTargetSalePrice(recipeData.targetSalePricePerServing || 0);
        setIngredients(recipeData.ingredients);
        setInstructions(recipeData.instructions.join('\n'));
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleAddIngredient = () => {
        if (inventory.length > 0) {
            setIngredients([...ingredients, { itemId: inventory[0].id, quantity: 0, unit: 'g' }]);
        }
    };
    
    const handleIngredientChange = (index: number, field: keyof Ingredient, value: string) => {
        const newIngredients = [...ingredients];
        const isQuantity = field === 'quantity';
        newIngredients[index] = { ...newIngredients[index], [field]: isQuantity ? parseFloat(value) || 0 : value };
        setIngredients(newIngredients);
    };

    const handleRemoveIngredient = (index: number) => {
        setIngredients(ingredients.filter((_, i) => i !== index));
    };
    
    const handleSave = () => {
        const newErrors: { [key: string]: string } = {};
        if (!name.trim()) newErrors.name = 'Recipe name is required.';
        if (!category.trim()) newErrors.category = 'Category is required.';
        if (servings <= 0) newErrors.servings = 'Servings must be greater than 0.';
        if (ingredients.length === 0) newErrors.ingredients = 'At least one ingredient is required.';
        if (ingredients.some(ing => ing.quantity <= 0)) newErrors.ingredients = 'All ingredient quantities must be positive.';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const instructionSteps = instructions.split('\n').filter(line => line.trim() !== '');
        
        onSave({ name, category, servings, targetSalePricePerServing, ingredients, instructions: instructionSteps });
        handleClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Create New Recipe">
             <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Use a Template (Optional)</label>
                    <select
                        onChange={(e) => handleTemplateSelect(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-white"
                        defaultValue=""
                    >
                        <option value="">Start from scratch</option>
                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Recipe Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className={`w-full mt-1 border rounded-md p-2 ${errors.name ? 'border-red-500' : 'border-gray-300'}`} />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Category</label>
                         <input
                            type="text"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="e.g., Main Course"
                            className={`w-full mt-1 border rounded-md p-2 ${errors.category ? 'border-red-500' : 'border-gray-300'}`}
                            list="recipe-categories"
                        />
                        <datalist id="recipe-categories">
                            {categories.map((cat) => <option key={cat.id} value={cat.name} />)}
                        </datalist>
                        {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Servings</label>
                        <input type="number" min="1" value={servings} onChange={e => setServings(parseInt(e.target.value) || 1)} className={`w-full mt-1 border rounded-md p-2 ${errors.servings ? 'border-red-500' : 'border-gray-300'}`} />
                        {errors.servings && <p className="text-red-500 text-xs mt-1">{errors.servings}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Target Sale Price/Serving</label>
                        <input type="number" min="0" step="0.01" value={targetSalePricePerServing} onChange={e => setTargetSalePrice(parseFloat(e.target.value) || 0)} className="w-full mt-1 border rounded-md p-2 border-gray-300" />
                    </div>
                </div>
                <div>
                    <h4 className="text-sm font-medium mb-2">Ingredients</h4>
                    {errors.ingredients && <p className="text-red-500 text-xs mb-2">{errors.ingredients}</p>}
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                       {ingredients.map((ing, index) => (
                           <div key={index} className="grid grid-cols-[1fr,100px,80px,auto] gap-2 items-center">
                               <select value={ing.itemId} onChange={e => handleIngredientChange(index, 'itemId', e.target.value)} className="w-full border rounded-md p-2 bg-white">
                                   {inventory.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                               </select>
                               <input type="number" value={ing.quantity} onChange={e => handleIngredientChange(index, 'quantity', e.target.value)} className="w-full border rounded-md p-2" />
                               <select value={ing.unit} onChange={e => handleIngredientChange(index, 'unit', e.target.value)} className="w-full border rounded-md p-2 bg-white">
                                   {allUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                               </select>
                               <button onClick={() => handleRemoveIngredient(index)} className="text-red-500 hover:text-red-700"><X size={18} /></button>
                           </div>
                       ))}
                    </div>
                    <button onClick={handleAddIngredient} className="text-sm text-primary mt-2 flex items-center"><PlusCircle size={16} className="mr-1"/> Add Ingredient</button>
                </div>

                <div className="bg-primary/5 p-3 rounded-lg text-sm mt-4">
                    <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Calculated Total Cost:</span>
                        <span className="font-semibold text-text-primary">{formatCurrency(recipeCost)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                        <span className="text-text-secondary">Cost per Serving:</span>
                        <span className="font-semibold text-text-primary">{formatCurrency(costPerServing)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-primary/20">
                         <div className="text-text-secondary">
                            <span className="font-medium">Suggested Sale Price</span>
                            <p className="text-xs">Based on a 30% food cost target.</p>
                        </div>
                        <span className="font-bold text-lg text-primary">{formatCurrency(suggestedPrice)}</span>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mt-4">Instructions (one step per line)</label>
                    <textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={5} className="w-full mt-1 border rounded-md p-2 border-gray-300"></textarea>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                    <button onClick={handleClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700">Save Recipe</button>
                </div>
            </div>
        </Modal>
    );
};

const CategoryManagerModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
}> = ({ isOpen, onClose }) => {
    const { categories, addCategory, updateCategory, deleteCategory } = useData();
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState<{ id: string, name: string} | null>(null);

    const handleAdd = () => {
        if (newCategoryName.trim()) {
            addCategory(newCategoryName.trim());
            setNewCategoryName('');
        }
    };

    const handleUpdate = () => {
        if (editingCategory && editingCategory.name.trim()) {
            updateCategory(editingCategory.id, editingCategory.name.trim());
            setEditingCategory(null);
        }
    };
    
    const handleDelete = (id: string) => {
        const result = deleteCategory(id);
        if(!result.success) {
            alert(result.message);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Manage Recipe Categories">
            <div className="space-y-4">
                <div>
                    <h3 className="text-md font-semibold mb-2">Add New Category</h3>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="e.g., Desserts"
                            className="flex-grow p-2 border rounded-md"
                        />
                        <button onClick={handleAdd} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400" disabled={!newCategoryName.trim()}>Add</button>
                    </div>
                </div>
                <div>
                    <h3 className="text-md font-semibold mb-2">Existing Categories</h3>
                    <ul className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2 bg-gray-50/50">
                        {categories.map(cat => (
                            <li key={cat.id} className="flex items-center justify-between p-2 hover:bg-gray-100 rounded">
                                {editingCategory?.id === cat.id ? (
                                    <input
                                        type="text"
                                        value={editingCategory.name}
                                        onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                        onBlur={handleUpdate}
                                        onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                                        className="p-1 border rounded-md w-full"
                                        autoFocus
                                    />
                                ) : (
                                    <span>{cat.name}</span>
                                )}
                                <div className="space-x-2">
                                     <button onClick={() => setEditingCategory(cat)} className="text-primary hover:text-indigo-700"><Edit3 size={16} /></button>
                                     <button onClick={() => handleDelete(cat.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </Modal>
    );
}

const UnitManagerModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
}> = ({ isOpen, onClose }) => {
    const { ingredientUnits, addUnit, updateUnit, deleteUnit } = useData();
    const [newUnitName, setNewUnitName] = useState('');
    const [editingUnit, setEditingUnit] = useState<IngredientUnit | null>(null);

    const handleAdd = () => {
        if (newUnitName.trim()) {
            addUnit(newUnitName.trim());
            setNewUnitName('');
        }
    };

    const handleUpdate = () => {
        if (editingUnit && editingUnit.name.trim()) {
            updateUnit(editingUnit.id, editingUnit.name.trim());
            setEditingUnit(null);
        }
    };
    
    const handleDelete = (id: string) => {
        const result = deleteUnit(id);
        if(!result.success) {
            alert(result.message);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Manage Ingredient Units">
            <div className="space-y-4">
                <div>
                    <h3 className="text-md font-semibold mb-2">Add New Unit</h3>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={newUnitName}
                            onChange={(e) => setNewUnitName(e.target.value)}
                            placeholder="e.g., pinch, bunch"
                            className="flex-grow p-2 border rounded-md"
                        />
                        <button onClick={handleAdd} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400" disabled={!newUnitName.trim()}>Add</button>
                    </div>
                </div>
                <div>
                    <h3 className="text-md font-semibold mb-2">Custom Units</h3>
                    <ul className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2 bg-gray-50/50">
                        {ingredientUnits.map(unit => (
                            <li key={unit.id} className="flex items-center justify-between p-2 hover:bg-gray-100 rounded">
                                {editingUnit?.id === unit.id ? (
                                    <input
                                        type="text"
                                        value={editingUnit.name}
                                        onChange={(e) => setEditingUnit({ ...editingUnit, name: e.target.value })}
                                        onBlur={handleUpdate}
                                        onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                                        className="p-1 border rounded-md w-full"
                                        autoFocus
                                    />
                                ) : (
                                    <span>{unit.name}</span>
                                )}
                                <div className="space-x-2">
                                     <button onClick={() => setEditingUnit(unit)} className="text-primary hover:text-indigo-700"><Edit3 size={16} /></button>
                                     <button onClick={() => handleDelete(unit.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                                </div>
                            </li>
                        ))}
                         {ingredientUnits.length === 0 && <li className="text-center text-gray-500 py-2">No custom units created yet.</li>}
                    </ul>
                </div>
            </div>
        </Modal>
    );
}


const Recipes: React.FC = () => {
    const { recipes, getInventoryItemById, updateRecipe, deleteRecipe, addRecipe, recordRecipeCostHistory, duplicateRecipe, calculateRecipeCost, activeBusinessId, categories, recipeTemplates, addRecipeTemplate, inventory, getConversionFactor, ingredientUnits, uploadRecipeImage, removeRecipeImage } = useData();
    const { formatCurrency } = useCurrency();
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [isNewRecipeModalOpen, setIsNewRecipeModalOpen] = useState(false);
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [isHistoryVisible, setIsHistoryVisible] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    
    // Modal states
    const [modalState, setModalState] = useState<{ type: null | 'delete' | 'duplicate' | 'saveTemplate' | 'manageCategories' | 'manageUnits' } >({ type: null });
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const dragItem = React.useRef<any>(null);
    const dragOverItem = React.useRef<any>(null);
    
    const allUnits = useMemo(() => {
        return [...new Set([...DEFAULT_UNITS, ...ingredientUnits.map(u => u.name)])]
    }, [ingredientUnits]);

    const filteredRecipes = useMemo(() => {
        return recipes
            .filter(r => filterCategory === 'all' || r.category === filterCategory)
            .filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [recipes, filterCategory, searchTerm]);

    useEffect(() => {
        if (selectedRecipe && !filteredRecipes.some(r => r.id === selectedRecipe.id)) {
            setSelectedRecipe(filteredRecipes.length > 0 ? filteredRecipes[0] : null);
        } else if (!selectedRecipe && filteredRecipes.length > 0) {
            setSelectedRecipe(filteredRecipes[0]);
        }
        
        if (selectedRecipe) {
            recordRecipeCostHistory(selectedRecipe.id);
        }
    }, [filteredRecipes, selectedRecipe, recordRecipeCostHistory]);

    useEffect(() => {
        if (recipes.length > 0 && !recipes.find(r => r.id === selectedRecipe?.id)) {
            setSelectedRecipe(recipes[0]);
        } else if (recipes.length === 0) {
            setSelectedRecipe(null);
        }
    }, [activeBusinessId, recipes, selectedRecipe]);

    const handleInstructionChange = (instIndex: number, newText: string) => {
        if (!selectedRecipe) return;
        const updatedInstructions = selectedRecipe.instructions.map((inst, index) => index === instIndex ? newText : inst);
        const updatedRecipe = { ...selectedRecipe, instructions: updatedInstructions };
        setSelectedRecipe(updatedRecipe);
        updateRecipe(updatedRecipe);
    };
    
    const handleAddInstruction = () => {
        if (!selectedRecipe) return;
        const updatedRecipe = { ...selectedRecipe, instructions: [...selectedRecipe.instructions, 'New step'] };
        setSelectedRecipe(updatedRecipe);
        updateRecipe(updatedRecipe);
    };

    const handleRemoveInstruction = (instIndex: number) => {
        if (!selectedRecipe) return;
        const updatedInstructions = selectedRecipe.instructions.filter((_, index) => index !== instIndex);
        const updatedRecipe = { ...selectedRecipe, instructions: updatedInstructions };
        setSelectedRecipe(updatedRecipe);
        updateRecipe(updatedRecipe);
    };
    
    const handleDragSort = () => {
        if (!selectedRecipe || dragItem.current === null || dragOverItem.current === null) return;
        const newInstructions = [...selectedRecipe.instructions];
        const draggedItemContent = newInstructions.splice(dragItem.current, 1)[0];
        newInstructions.splice(dragOverItem.current, 0, draggedItemContent);
        dragItem.current = null;
        dragOverItem.current = null;
        
        const updatedRecipe = { ...selectedRecipe, instructions: newInstructions };
        setSelectedRecipe(updatedRecipe);
        updateRecipe(updatedRecipe);
        setDraggedIndex(null);
    };

    const handleConfirmDelete = () => {
        if (!selectedRecipe) return;
        const result = deleteRecipe(selectedRecipe.id);
        if (result.success) {
             const newSelected = recipes.length > 1 ? recipes.filter(r => r.id !== selectedRecipe.id)[0] : null;
             setSelectedRecipe(newSelected);
        } else {
             setDeleteError(result.message || 'An unknown error occurred.');
        }
    };

    const handleConfirmDuplicate = (includeHistory: boolean) => {
        if (!selectedRecipe) return;
        const newRecipe = duplicateRecipe(selectedRecipe.id, includeHistory);
        if (newRecipe) {
            setSelectedRecipe(newRecipe);
        }
    };

    const handleSaveAsTemplate = (templateName: string) => {
        if (!selectedRecipe || !templateName.trim()) return;
        const { id, name, costHistory, businessId, imageUrl, ...recipeData } = selectedRecipe;
        addRecipeTemplate({ name: templateName.trim(), recipeData });
    };

    const handleIngredientChange = (ingIndex: number, field: keyof Ingredient, value: string) => {
        if (!selectedRecipe) return;
        const newIngredients = [...selectedRecipe.ingredients];
        const isQuantity = field === 'quantity';
        const updatedIngredient = {
            ...newIngredients[ingIndex],
            [field]: isQuantity ? parseFloat(value) || 0 : value,
        };
        newIngredients[ingIndex] = updatedIngredient;
        const updatedRecipe = { ...selectedRecipe, ingredients: newIngredients };
        setSelectedRecipe(updatedRecipe);
        updateRecipe(updatedRecipe);
    };

    const handleAddIngredientToRecipe = () => {
        if (!selectedRecipe || inventory.length === 0) return;
        const newIngredient: Ingredient = { itemId: inventory[0].id, quantity: 1, unit: 'unit' };
        const updatedRecipe = { ...selectedRecipe, ingredients: [...selectedRecipe.ingredients, newIngredient] };
        setSelectedRecipe(updatedRecipe);
        updateRecipe(updatedRecipe);
    };

    const handleRemoveIngredientFromRecipe = (ingIndex: number) => {
        if (!selectedRecipe) return;
        const updatedIngredients = selectedRecipe.ingredients.filter((_, index) => index !== ingIndex);
        const updatedRecipe = { ...selectedRecipe, ingredients: updatedIngredients };
        setSelectedRecipe(updatedRecipe);
        updateRecipe(updatedRecipe);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !selectedRecipe) {
            return;
        }
        const file = e.target.files[0];
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert("File is too large. Please select an image under 5MB.");
            return;
        }
        if (!file.type.startsWith('image/')) {
            alert("Please select a valid image file.");
            return;
        }

        setIsUploading(true);
        try {
            await uploadRecipeImage(selectedRecipe.id, file);
        } catch (error) {
            console.error(error);
            alert("An error occurred during upload.");
        } finally {
            setIsUploading(false);
        }
    };
    
    const handleImageRemove = async () => {
        if (!selectedRecipe || !selectedRecipe.imageUrl) return;
        if (window.confirm("Are you sure you want to remove this image?")) {
            setIsUploading(true); // Re-use for loading state
            try {
                await removeRecipeImage(selectedRecipe.id);
                 // The recipe object in context will be updated, this will cause a re-render.
                // We need to update the local selectedRecipe state too.
                setSelectedRecipe(prev => prev ? { ...prev, imageUrl: undefined } : null);
            } catch (error) {
                console.error(error);
                alert("An error occurred while removing the image.");
            } finally {
                setIsUploading(false);
            }
        }
    };


    const selectedRecipeCost = selectedRecipe ? calculateRecipeCost(selectedRecipe) : 0;
    const selectedCostPerServing = (selectedRecipe && selectedRecipe.servings > 0) ? selectedRecipeCost / selectedRecipe.servings : 0;
    const suggestedSalePrice = selectedCostPerServing > 0 ? selectedCostPerServing / 0.30 : 0;

    return (
        <>
        <RecipeFormModal isOpen={isNewRecipeModalOpen} onClose={() => setIsNewRecipeModalOpen(false)} onSave={addRecipe} categories={categories} templates={recipeTemplates} />
        <CategoryManagerModal isOpen={modalState.type === 'manageCategories'} onClose={() => setModalState({ type: null })} />
        <UnitManagerModal isOpen={modalState.type === 'manageUnits'} onClose={() => setModalState({ type: null })} />


        {selectedRecipe && <>
            <ConfirmationModal
                isOpen={modalState.type === 'delete'}
                onClose={() => { setModalState({ type: null }); setDeleteError(null); }}
                onConfirm={handleConfirmDelete}
                title="Delete Recipe"
                message={deleteError ? <span className="text-red-700">{deleteError}</span> : `Are you sure you want to permanently delete "${selectedRecipe.name}"? This action cannot be undone.`}
                confirmText={deleteError ? 'OK' : 'Delete'}
                confirmButtonClass={deleteError ? 'bg-primary hover:bg-indigo-700' : 'bg-red-600 hover:bg-red-700'}
                cancelText={deleteError ? '' : 'Cancel'}
            />
            <Modal isOpen={modalState.type === 'duplicate'} onClose={() => setModalState({ type: null })} title="Duplicate Recipe">
                <div>
                    <p className="mb-4">Do you want to include the cost history in the new duplicated recipe?</p>
                    <div className="flex justify-end space-x-2">
                        <button onClick={() => { handleConfirmDuplicate(false); setModalState({ type: null }); }} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">No, Start Fresh</button>
                        <button onClick={() => { handleConfirmDuplicate(true); setModalState({ type: null }); }} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700">Yes, Include History</button>
                    </div>
                </div>
            </Modal>
            <Modal isOpen={modalState.type === 'saveTemplate'} onClose={() => setModalState({ type: null })} title="Save as Template">
                <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const templateName = formData.get('templateName') as string;
                    handleSaveAsTemplate(templateName);
                    setModalState({ type: null });
                }}>
                    <label htmlFor="templateName" className="block text-sm font-medium text-gray-700">Template Name</label>
                    <input type="text" name="templateName" id="templateName" defaultValue={`${selectedRecipe.name} Base`} className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm border-gray-300" required />
                    <div className="flex justify-end space-x-2 pt-4 mt-2">
                        <button type="button" onClick={() => setModalState({ type: null })} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700">Save Template</button>
                    </div>
                </form>
            </Modal>
        </>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Recipes</h2>
                    <button onClick={() => setIsNewRecipeModalOpen(true)} className="flex items-center text-primary hover:text-indigo-700" title="New Recipe">
                        <PlusCircle size={22} />
                    </button>
                </div>
                 <div className="mb-4 space-y-3">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search recipes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                            aria-label="Search recipes by name"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    </div>
                    <div className="flex items-center space-x-2">
                         <select
                            id="category-filter"
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value)}
                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-white"
                            aria-label="Filter by category"
                        >
                            <option value="all">All Categories</option>
                            {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                        </select>
                        <button onClick={() => setModalState({ type: 'manageCategories' })} className="p-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50" title="Manage Categories">
                           <ListChecks size={20} className="text-gray-600"/>
                        </button>
                         <button onClick={() => setModalState({ type: 'manageUnits' })} className="p-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50" title="Manage Units">
                           <Weight size={20} className="text-gray-600"/>
                        </button>
                    </div>
                </div>
                <ul className="space-y-2 max-h-[calc(65vh-120px)] overflow-y-auto">
                    {filteredRecipes.map(recipe => (
                        <li
                            key={recipe.id}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedRecipe?.id === recipe.id ? 'bg-primary/20' : 'hover:bg-white/20'}`}
                            onClick={() => { setSelectedRecipe(recipe); setIsHistoryVisible(false); }}
                        >
                            <div className="font-semibold text-text-primary">{recipe.name}</div>
                            <div className="text-xs text-text-secondary mt-1">Cost/Serving: {formatCurrency(calculateRecipeCost(recipe) / (recipe.servings || 1))}</div>
                        </li>
                    ))}
                </ul>
            </Card>

            <Card className="lg:col-span-2">
                {selectedRecipe ? (
                    <div>
                        <div className="flex justify-between items-start mb-4">
                             <h2 className="text-2xl font-bold">{selectedRecipe.name}</h2>
                             <div className="flex items-center space-x-2">
                                <button onClick={() => setModalState({ type: 'saveTemplate'})} className="p-2 rounded-full hover:bg-primary/10" title="Save as Template">
                                    <FileText size={20} className="text-primary" />
                                </button>
                                <button onClick={() => setModalState({ type: 'duplicate'})} className="p-2 rounded-full hover:bg-primary/10" title="Duplicate Recipe">
                                    <Copy size={20} className="text-primary" />
                                </button>
                                <button onClick={() => setModalState({ type: 'delete'})} className="p-2 rounded-full hover:bg-red-100" title="Delete Recipe">
                                    <Trash2 size={20} className="text-red-500" />
                                </button>
                             </div>
                        </div>

                        <div className="relative group w-full h-48 bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden border border-dashed border-gray-300">
                            {isUploading ? (
                                <div className="flex flex-col items-center text-primary">
                                    <Loader2 size={32} className="animate-spin"/>
                                    <p className="mt-2 text-sm">Processing...</p>
                                </div>
                            ) : selectedRecipe.imageUrl ? (
                                <>
                                    <img src={selectedRecipe.imageUrl} alt={selectedRecipe.name} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                                        <label htmlFor="image-upload" className="cursor-pointer text-white bg-white/20 p-3 rounded-full hover:bg-white/30" title="Change image">
                                            <Edit size={20} />
                                            <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                        </label>
                                        <button onClick={handleImageRemove} className="text-white bg-white/20 p-3 rounded-full hover:bg-white/30" title="Remove image">
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <label htmlFor="image-upload" className="cursor-pointer text-center text-text-secondary p-4 rounded-lg hover:bg-gray-200/50 transition-colors w-full h-full flex flex-col justify-center items-center">
                                    <UploadCloud size={32} className="mx-auto text-gray-400" />
                                    <span className="mt-2 block text-sm font-semibold text-primary">Upload an image</span>
                                    <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                                    <input id="image-upload" type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleImageUpload} />
                                </label>
                            )}
                        </div>


                        {suggestedSalePrice > 0 && (
                            <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg mb-6 flex items-center">
                                <Lightbulb className="text-primary mr-4 flex-shrink-0" size={24} />
                                <div>
                                    <p className="font-semibold text-primary">Suggested Sale Price: {formatCurrency(suggestedSalePrice)}</p>
                                    <p className="text-sm text-text-secondary">This suggestion is based on a 30% food cost target, a common industry benchmark for profitability.</p>
                                </div>
                            </div>
                        )}

                        <div className="mt-6">
                            <button
                                onClick={() => setIsHistoryVisible(!isHistoryVisible)}
                                className="flex items-center justify-between w-full p-3 bg-white/30 hover:bg-white/40 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary"
                                aria-expanded={isHistoryVisible}
                            >
                                <div className="flex items-center">
                                    <TrendingUp className="mr-2 text-primary" size={20} />
                                    <h3 className="text-lg font-semibold">Cost History</h3>
                                </div>
                                {isHistoryVisible ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                            {isHistoryVisible && (
                                <div className="mt-4 p-4 border border-white/20 rounded-lg bg-white/40">
                                    {selectedRecipe.costHistory && selectedRecipe.costHistory.length > 1 ? (
                                        <ResponsiveContainer width="100%" height={250}>
                                            <LineChart data={selectedRecipe.costHistory} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis 
                                                    dataKey="date" 
                                                    tickFormatter={(dateStr) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    tick={{ fontSize: 12 }}
                                                />
                                                <YAxis 
                                                    tickFormatter={(value) => formatCurrency(value)}
                                                    domain={['dataMin - 5', 'dataMax + 5']}
                                                    tick={{ fontSize: 12 }}
                                                />
                                                <Tooltip 
                                                    formatter={(value: number) => [formatCurrency(value), 'Total Cost']}
                                                    labelFormatter={(dateStr) => new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                />
                                                <Line type="monotone" dataKey="cost" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <p className="text-center text-text-secondary py-4">Not enough data to display cost history chart.</p>
                                    )}
                                </div>
                            )}
                        </div>

                         <div className="flex justify-between items-center mt-6 mb-2">
                             <h3 className="text-lg font-semibold">Ingredients</h3>
                             <button onClick={handleAddIngredientToRecipe} className="flex items-center text-sm text-primary hover:text-indigo-700">
                                <Plus size={16} className="mr-1" /> Add Ingredient
                            </button>
                        </div>
                         <div className="overflow-x-auto border border-black/10 rounded-lg">
                            <table className="w-full text-left">
                                <thead className="text-sm border-b border-black/10">
                                    <tr>
                                        <th className="p-3 font-semibold">Ingredient</th>
                                        <th className="p-3 font-semibold">Quantity</th>
                                        <th className="p-3 font-semibold">Unit</th>
                                        <th className="p-3 font-semibold text-right">Cost</th>
                                        <th className="p-3 font-semibold"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedRecipe.ingredients.map((ing, index) => {
                                        const item = getInventoryItemById(ing.itemId);
                                        const costConversionFactor = item ? getConversionFactor(ing.unit, item.unit) || 1 : 1;
                                        const ingredientCost = item ? item.unitCost * ing.quantity * costConversionFactor : 0;
                                       
                                        return (
                                            <tr key={`${ing.itemId}-${index}`} className="border-b border-black/5 last:border-b-0 hover:bg-white/20">
                                                <td className="p-2">
                                                    <select value={ing.itemId} onChange={e => handleIngredientChange(index, 'itemId', e.target.value)} className="w-full border rounded-md p-2 bg-white text-sm">
                                                        {inventory.map(invItem => <option key={invItem.id} value={invItem.id}>{invItem.name}</option>)}
                                                    </select>
                                                </td>
                                                <td className="p-2">
                                                     <input type="number" value={ing.quantity} onChange={e => handleIngredientChange(index, 'quantity', e.target.value)} className="w-20 border rounded-md p-2 text-sm" />
                                                </td>
                                                <td className="p-2">
                                                    <select value={ing.unit} onChange={e => handleIngredientChange(index, 'unit', e.target.value)} className="w-full border rounded-md p-2 bg-white text-sm">
                                                        {allUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                                                    </select>
                                                </td>
                                                <td className="p-2 text-right">
                                                    {item ? (
                                                        <div className="flex flex-col items-end">
                                                            <span className="font-medium text-text-primary text-sm">{formatCurrency(ingredientCost)}</span>
                                                            <span className="text-xs text-text-secondary">
                                                                {formatCurrency(item.unitCost)} / {item.unit}
                                                            </span>
                                                        </div>
                                                    ) : <span className="text-red-500 text-xs">Item not found</span>}
                                                </td>
                                                <td className="p-2 text-center">
                                                    <button onClick={() => handleRemoveIngredientFromRecipe(index)} className="text-red-400 hover:text-red-600"><XCircle size={18} /></button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot className="font-semibold border-t-2 border-black/10 text-text-primary">
                                    <tr>
                                        <td colSpan={3} className="p-3 text-right text-lg">Total Recipe Cost:</td>
                                        <td className="p-3 text-right text-lg">{formatCurrency(selectedRecipeCost)}</td>
                                        <td></td>
                                    </tr>
                                    <tr className="bg-primary/5">
                                        <td colSpan={3} className="p-3 text-right text-primary text-lg">Cost per Serving:</td>
                                        <td className="p-3 text-right text-primary text-lg">{formatCurrency(selectedCostPerServing)}</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        <div className="flex justify-between items-center mt-6 mb-2">
                             <h3 className="text-lg font-semibold">Instructions</h3>
                             <button onClick={handleAddInstruction} className="flex items-center text-sm text-primary hover:text-indigo-700">
                                <Plus size={16} className="mr-1" /> Add Step
                            </button>
                        </div>
                        <ol className="list-decimal list-inside space-y-2">
                           {selectedRecipe.instructions.map((instruction, index) => (
                               <li 
                                   key={index} 
                                   className={`flex items-start group p-2 rounded-md transition-shadow ${draggedIndex === index ? 'shadow-lg bg-primary/10' : ''}`}
                                   draggable
                                   onDragStart={() => { dragItem.current = index; setDraggedIndex(index); }}
                                   onDragEnter={() => dragOverItem.current = index}
                                   onDragEnd={handleDragSort}
                                   onDragOver={(e) => e.preventDefault()}
                                >
                                   <GripVertical className="mr-2 text-gray-400 cursor-grab flex-shrink-0 mt-1" size={18} />
                                   <span className="mr-2 text-text-secondary font-semibold mt-1">{index + 1}.</span>
                                   <textarea 
                                        value={instruction}
                                        onChange={(e) => handleInstructionChange(index, e.target.value)}
                                        rows={Math.max(1, Math.ceil(instruction.length / 50))}
                                        className="flex-grow p-1 border border-transparent hover:border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-md transition-colors w-full text-text-secondary bg-transparent resize-none"
                                   />
                                   <button onClick={() => handleRemoveInstruction(index)} className="ml-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                                       <XCircle size={18} />
                                   </button>
                               </li>
                           ))}
                        </ol>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-text-secondary p-8 text-center">
                        <FileText size={48} className="mb-4 text-gray-300" />
                        <h3 className="text-lg font-semibold">No Recipe Selected</h3>
                        <p className="max-w-xs mt-1">Select a recipe from the list to view its details, or create a new one to get started.</p>
                         <button onClick={() => setIsNewRecipeModalOpen(true)} className="mt-4 flex items-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                            <PlusCircle size={20} className="mr-2" />
                            Create Recipe
                        </button>
                    </div>
                )}
            </Card>
        </div>
        </>
    );
};

export default Recipes;