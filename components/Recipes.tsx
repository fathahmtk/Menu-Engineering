import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Card from './common/Card';
import Modal from './common/Modal';
import ConfirmationModal from './common/ConfirmationModal';
import { useData } from '../hooks/useDataContext';
import { useCurrency } from '../hooks/useCurrencyContext';
import { PlusCircle, Trash2, Edit, Plus, X, XCircle, Search, GripVertical, CheckCircle, TrendingUp, ChevronDown, ChevronUp, Lightbulb, Copy, FileText, Save, ListChecks, Edit3, UploadCloud, Loader2, Weight, ChevronLeft } from 'lucide-react';
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
                    <label className="block text-sm font-medium text-foreground">Use a Template (Optional)</label>
                    <select
                        onChange={(e) => handleTemplateSelect(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm rounded-md"
                        defaultValue=""
                    >
                        <option value="">Start from scratch</option>
                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Recipe Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className={`w-full mt-1 border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring ${errors.name ? 'border-destructive' : 'border-input'}`} />
                        {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Category</label>
                         <input
                            type="text"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="e.g., Main Course"
                            className={`w-full mt-1 border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring ${errors.category ? 'border-destructive' : 'border-input'}`}
                            list="recipe-categories"
                        />
                        <datalist id="recipe-categories">
                            {categories.map((cat) => <option key={cat.id} value={cat.name} />)}
                        </datalist>
                        {errors.category && <p className="text-destructive text-xs mt-1">{errors.category}</p>}
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Servings</label>
                        <input type="number" min="1" value={servings} onChange={e => setServings(parseInt(e.target.value) || 1)} className={`w-full mt-1 border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring ${errors.servings ? 'border-destructive' : 'border-input'}`} />
                        {errors.servings && <p className="text-destructive text-xs mt-1">{errors.servings}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Target Sale Price/Serving</label>
                        <input type="number" min="0" step="0.01" value={targetSalePricePerServing} onChange={e => setTargetSalePrice(parseFloat(e.target.value) || 0)} className="w-full mt-1 border-input border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                </div>
                <div>
                    <h4 className="text-sm font-medium mb-2">Ingredients</h4>
                    {errors.ingredients && <p className="text-destructive text-xs mb-2">{errors.ingredients}</p>}
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                       {ingredients.map((ing, index) => (
                           <div key={index} className="grid grid-cols-[1fr,100px,80px,auto] gap-2 items-center">
                               <select value={ing.itemId} onChange={e => handleIngredientChange(index, 'itemId', e.target.value)} className="w-full border-input border rounded-md p-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                                   {inventory.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                               </select>
                               <input type="number" value={ing.quantity} onChange={e => handleIngredientChange(index, 'quantity', e.target.value)} className="w-full border-input border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring" />
                               <select value={ing.unit} onChange={e => handleIngredientChange(index, 'unit', e.target.value)} className="w-full border-input border rounded-md p-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                                   {allUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                               </select>
                               <button onClick={() => handleRemoveIngredient(index)} className="text-destructive/80 hover:text-destructive"><X size={18} /></button>
                           </div>
                       ))}
                    </div>
                    <button onClick={handleAddIngredient} className="text-sm text-primary mt-2 flex items-center"><PlusCircle size={16} className="mr-1"/> Add Ingredient</button>
                </div>

                <div className="bg-primary/5 p-3 rounded-lg text-sm mt-4">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Calculated Total Cost:</span>
                        <span className="font-semibold text-foreground">{formatCurrency(recipeCost)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                        <span className="text-muted-foreground">Cost per Serving:</span>
                        <span className="font-semibold text-foreground">{formatCurrency(costPerServing)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-primary/20">
                         <div className="text-muted-foreground">
                            <span className="font-medium">Suggested Sale Price</span>
                            <p className="text-xs">Based on a 30% food cost target.</p>
                        </div>
                        <span className="font-bold text-lg text-primary">{formatCurrency(suggestedPrice)}</span>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mt-4">Instructions (one step per line)</label>
                    <textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={5} className="w-full mt-1 border-input border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring"></textarea>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                    <button onClick={handleClose} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">Save Recipe</button>
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
                            className="flex-grow p-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <button onClick={handleAdd} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:bg-primary/50" disabled={!newCategoryName.trim()}>Add</button>
                    </div>
                </div>
                <div>
                    <h3 className="text-md font-semibold mb-2">Existing Categories</h3>
                    <ul className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2 bg-muted/50">
                        {categories.map(cat => (
                            <li key={cat.id} className="flex items-center justify-between p-2 hover:bg-accent rounded">
                                {editingCategory?.id === cat.id ? (
                                    <input
                                        type="text"
                                        value={editingCategory.name}
                                        onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                        onBlur={handleUpdate}
                                        onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                                        className="p-1 border border-input rounded-md w-full"
                                        autoFocus
                                    />
                                ) : (
                                    <span className="text-foreground">{cat.name}</span>
                                )}
                                <div className="space-x-2">
                                     <button onClick={() => setEditingCategory(cat)} className="text-primary hover:text-primary/80"><Edit3 size={16} /></button>
                                     <button onClick={() => handleDelete(cat.id)} className="text-destructive hover:text-destructive/80"><Trash2 size={16} /></button>
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
                            className="flex-grow p-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <button onClick={handleAdd} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:bg-primary/50" disabled={!newUnitName.trim()}>Add</button>
                    </div>
                </div>
                <div>
                    <h3 className="text-md font-semibold mb-2">Custom Units</h3>
                    <ul className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2 bg-muted/50">
                        {ingredientUnits.map(unit => (
                            <li key={unit.id} className="flex items-center justify-between p-2 hover:bg-accent rounded">
                                {editingUnit?.id === unit.id ? (
                                    <input
                                        type="text"
                                        value={editingUnit.name}
                                        onChange={(e) => setEditingUnit({ ...editingUnit, name: e.target.value })}
                                        onBlur={handleUpdate}
                                        onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                                        className="p-1 border border-input rounded-md w-full"
                                        autoFocus
                                    />
                                ) : (
                                    <span className="text-foreground">{unit.name}</span>
                                )}
                                <div className="space-x-2">
                                     <button onClick={() => setEditingUnit(unit)} className="text-primary hover:text-primary/80"><Edit3 size={16} /></button>
                                     <button onClick={() => handleDelete(unit.id)} className="text-destructive hover:text-destructive/80"><Trash2 size={16} /></button>
                                </div>
                            </li>
                        ))}
                         {ingredientUnits.length === 0 && <li className="text-center text-muted-foreground py-2">No custom units created yet.</li>}
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
                confirmButtonClass={deleteError ? 'bg-primary hover:bg-primary/90' : 'bg-destructive hover:bg-destructive/90'}
                cancelText={deleteError ? '' : 'Cancel'}
            />
            <Modal isOpen={modalState.type === 'duplicate'} onClose={() => setModalState({ type: null })} title="Duplicate Recipe">
                <div>
                    <p className="mb-4">Do you want to include the cost history in the new duplicated recipe?</p>
                    <div className="flex justify-end space-x-2">
                        <button onClick={() => { handleConfirmDuplicate(false); setModalState({ type: null }); }} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80">No, Start Fresh</button>
                        <button onClick={() => { handleConfirmDuplicate(true); setModalState({ type: null }); }} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">Yes, Include History</button>
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
                    <label htmlFor="templateName" className="block text-sm font-medium text-foreground">Template Name</label>
                    <input type="text" name="templateName" id="templateName" defaultValue={`${selectedRecipe.name} Base`} className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm border-input" required />
                    <div className="flex justify-end space-x-2 pt-4 mt-2">
                        <button type="button" onClick={() => setModalState({ type: null })} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">Save Template</button>
                    </div>
                </form>
            </Modal>
        </>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`${selectedRecipe ? 'hidden lg:block' : 'block'} lg:col-span-1`}>
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Recipes</h2>
                        <button onClick={() => setIsNewRecipeModalOpen(true)} className="flex items-center text-primary hover:text-primary/80" title="New Recipe">
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
                                className="w-full pl-10 pr-4 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm"
                                aria-label="Search recipes by name"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                        </div>
                        <div className="flex items-center space-x-2">
                             <select
                                id="category-filter"
                                value={filterCategory}
                                onChange={e => setFilterCategory(e.target.value)}
                                className="block w-full pl-3 pr-10 py-2 text-base border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm rounded-md"
                                aria-label="Filter by category"
                            >
                                <option value="all">All Categories</option>
                                {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                            </select>
                            <button onClick={() => setModalState({ type: 'manageCategories' })} className="p-2 border border-input rounded-md bg-background hover:bg-accent" title="Manage Categories">
                               <ListChecks size={20} className="text-muted-foreground"/>
                            </button>
                             <button onClick={() => setModalState({ type: 'manageUnits' })} className="p-2 border border-input rounded-md bg-background hover:bg-accent" title="Manage Units">
                               <Weight size={20} className="text-muted-foreground"/>
                            </button>
                        </div>
                    </div>
                    <ul className="space-y-2 max-h-[calc(65vh-120px)] overflow-y-auto">
                        {filteredRecipes.map(recipe => (
                            <li
                                key={recipe.id}
                                className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedRecipe?.id === recipe.id ? 'bg-primary/10' : 'hover:bg-accent'}`}
                                onClick={() => { setSelectedRecipe(recipe); setIsHistoryVisible(false); }}
                            >
                                <div className="font-semibold text-foreground">{recipe.name}</div>
                                <div className="text-xs text-muted-foreground mt-1">Cost/Serving: {formatCurrency(calculateRecipeCost(recipe) / (recipe.servings || 1))}</div>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>
            
            <div className={`${!selectedRecipe ? 'hidden lg:block' : 'block'} lg:col-span-2`}>
                <Card>
                    {selectedRecipe ? (
                        <div>
                            <button 
                                onClick={() => setSelectedRecipe(null)}
                                className="lg:hidden flex items-center text-sm text-primary hover:text-primary/80 font-semibold mb-3 -ml-1"
                            >
                                <ChevronLeft size={20} />
                                Back to list
                            </button>
                            <div className="flex justify-between items-start mb-4">
                                 <h2 className="text-2xl font-bold">{selectedRecipe.name}</h2>
                                 <div className="flex items-center space-x-2">
                                    <button onClick={() => setModalState({ type: 'saveTemplate'})} className="p-2 rounded-full hover:bg-accent" title="Save as Template">
                                        <FileText size={20} className="text-primary" />
                                    </button>
                                    <button onClick={() => setModalState({ type: 'duplicate'})} className="p-2 rounded-full hover:bg-accent" title="Duplicate Recipe">
                                        <Copy size={20} className="text-primary" />
                                    </button>
                                    <button onClick={() => setModalState({ type: 'delete'})} className="p-2 rounded-full hover:bg-accent" title="Delete Recipe">
                                        <Trash2 size={20} className="text-destructive" />
                                    </button>
                                 </div>
                            </div>

                            <div className="relative group w-full h-48 bg-muted rounded-lg mb-4 flex items-center justify-center overflow-hidden border border-dashed border-border">
                                {isUploading ? (
                                    <div className="flex flex-col items-center text-primary">
                                        <Loader2 size={32} className="animate-spin"/>
                                        <p className="mt-2 text-sm">Processing...</p>
                                    </div>
                                ) : selectedRecipe.imageUrl ? (
                                    <>
                                        <img src={selectedRecipe.imageUrl} alt={selectedRecipe.name} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                                            <label htmlFor="image-upload" className="cursor-pointer text-white bg-black/30 p-3 rounded-full hover:bg-black/50" title="Change image">
                                                <Edit size={20} />
                                                <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                            </label>
                                            <button onClick={handleImageRemove} className="text-white bg-black/30 p-3 rounded-full hover:bg-black/50" title="Remove image">
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <label htmlFor="image-upload" className="cursor-pointer text-center text-muted-foreground p-4 rounded-lg hover:bg-accent transition-colors w-full h-full flex flex-col justify-center items-center">
                                        <UploadCloud size={32} className="mx-auto" />
                                        <span className="mt-2 block text-sm font-semibold text-primary">Upload an image</span>
                                        <p className="text-xs">PNG, JPG up to 5MB</p>
                                        <input id="image-upload" type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleImageUpload} />
                                    </label>
                                )}
                            </div>


                            {suggestedSalePrice > 0 && (
                                <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg mb-6 flex items-center">
                                    <Lightbulb className="text-primary mr-4 flex-shrink-0" size={24} />
                                    <div>
                                        <p className="font-semibold text-primary">Suggested Sale Price: {formatCurrency(suggestedSalePrice)}</p>
                                        <p className="text-sm text-muted-foreground">This suggestion is based on a 30% food cost target, a common industry benchmark for profitability.</p>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6">
                                <button
                                    onClick={() => setIsHistoryVisible(!isHistoryVisible)}
                                    className="flex items-center justify-between w-full p-3 bg-secondary hover:bg-accent rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                                    aria-expanded={isHistoryVisible}
                                >
                                    <div className="flex items-center">
                                        <TrendingUp className="mr-2 text-primary" size={20} />
                                        <h3 className="text-lg font-semibold">Cost History</h3>
                                    </div>
                                    {isHistoryVisible ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </button>
                                {isHistoryVisible && (
                                    <div className="mt-4 p-4 border border-border rounded-lg bg-background">
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
                                                    <Line type="monotone" dataKey="cost" stroke="hsl(244, 76%, 58%)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <p className="text-center text-muted-foreground py-4">Not enough data to display cost history chart.</p>
                                        )}
                                    </div>
                                )}
                            </div>

                             <div className="flex justify-between items-center mt-6 mb-2">
                                 <h3 className="text-lg font-semibold">Ingredients</h3>
                                 <button onClick={handleAddIngredientToRecipe} className="flex items-center text-sm text-primary hover:text-primary/80">
                                    <Plus size={16} className="mr-1" /> Add Ingredient
                                </button>
                            </div>
                             <div className="overflow-x-auto border border-border rounded-lg">
                                <table className="w-full text-left">
                                    <thead className="text-sm bg-muted">
                                        <tr>
                                            <th className="p-3 font-semibold text-muted-foreground">Ingredient</th>
                                            <th className="p-3 font-semibold text-muted-foreground">Quantity</th>
                                            <th className="p-3 font-semibold text-muted-foreground">Unit</th>
                                            <th className="p-3 font-semibold text-right text-muted-foreground">Cost</th>
                                            <th className="p-3 font-semibold"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedRecipe.ingredients.map((ing, index) => {
                                            const item = getInventoryItemById(ing.itemId);
                                            const costConversionFactor = item ? getConversionFactor(ing.unit, item.unit) || 1 : 1;
                                            const ingredientCost = item ? item.unitCost * ing.quantity * costConversionFactor : 0;
                                           
                                            return (
                                                <tr key={`${ing.itemId}-${index}`} className="border-b border-border last:border-b-0 hover:bg-accent">
                                                    <td className="p-2">
                                                        <select value={ing.itemId} onChange={e => handleIngredientChange(index, 'itemId', e.target.value)} className="w-full border rounded-md p-2 bg-background text-sm border-input focus:ring-ring focus:ring-1">
                                                            {inventory.map(invItem => <option key={invItem.id} value={invItem.id}>{invItem.name}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="p-2">
                                                         <input type="number" value={ing.quantity} onChange={e => handleIngredientChange(index, 'quantity', e.target.value)} className="w-20 border rounded-md p-2 text-sm border-input focus:ring-ring focus:ring-1" />
                                                    </td>
                                                    <td className="p-2">
                                                        <select value={ing.unit} onChange={e => handleIngredientChange(index, 'unit', e.target.value)} className="w-full border rounded-md p-2 bg-background text-sm border-input focus:ring-ring focus:ring-1">
                                                            {allUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="p-2 text-right">
                                                        {item ? (
                                                            <div className="flex flex-col items-end">
                                                                <span className="font-medium text-foreground text-sm">{formatCurrency(ingredientCost)}</span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {formatCurrency(item.unitCost)} / {item.unit}
                                                                </span>
                                                            </div>
                                                        ) : <span className="text-destructive text-xs">Item not found</span>}
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <button onClick={() => handleRemoveIngredientFromRecipe(index)} className="text-destructive/70 hover:text-destructive"><XCircle size={18} /></button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="font-semibold border-t-2 border-border text-foreground">
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
                                 <button onClick={handleAddInstruction} className="flex items-center text-sm text-primary hover:text-primary/80">
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
                                       <GripVertical className="mr-2 text-muted-foreground cursor-grab flex-shrink-0 mt-1" size={18} />
                                       <span className="mr-2 text-muted-foreground font-semibold mt-1">{index + 1}.</span>
                                       <textarea 
                                            value={instruction}
                                            onChange={(e) => handleInstructionChange(index, e.target.value)}
                                            rows={Math.max(1, Math.ceil(instruction.length / 50))}
                                            className="flex-grow p-1 border border-transparent hover:border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-md transition-colors w-full text-muted-foreground bg-transparent resize-none"
                                       />
                                       <button onClick={() => handleRemoveInstruction(index)} className="ml-2 text-destructive/60 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                                           <XCircle size={18} />
                                       </button>
                                   </li>
                               ))}
                            </ol>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
                            <FileText size={48} className="mb-4 text-border" />
                            <h3 className="text-lg font-semibold text-foreground">No Recipe Selected</h3>
                            <p className="max-w-xs mt-1">Select a recipe from the list to view its details, or create a new one to get started.</p>
                             <button onClick={() => setIsNewRecipeModalOpen(true)} className="mt-4 flex items-center bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                                <PlusCircle size={20} className="mr-2" />
                                Create Recipe
                            </button>
                        </div>
                    )}
                </Card>
            </div>
        </div>
        </>
    );
};

export default Recipes;