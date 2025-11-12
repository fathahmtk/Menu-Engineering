

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Card from './common/Card';
import Modal from './common/Modal';
import ConfirmationModal from './common/ConfirmationModal';
import { useData } from '../hooks/useDataContext';
import { useCurrency } from '../hooks/useCurrencyContext';
import { PlusCircle, Trash2, Edit, Plus, X, XCircle, Search, GripVertical, CheckCircle, TrendingUp, ChevronDown, ChevronUp, Lightbulb, Copy, FileText, Save, ListChecks, Edit3, UploadCloud, Loader2, Weight, ChevronLeft } from 'lucide-react';
import { Recipe, Ingredient, RecipeCategory, RecipeTemplate, IngredientUnit } from '../types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import ActionsDropdown from './common/ActionsDropdown';
import ImportModal from './common/ImportModal';
import { convertToCSV, downloadCSV } from '../utils/csvHelper';

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
                    <label className="block text-sm font-medium text-[var(--color-text-muted)]">Use a Template (Optional)</label>
                    <select
                        onChange={(e) => handleTemplateSelect(e.target.value)}
                        className="luxury-select mt-1 block w-full"
                        defaultValue=""
                    >
                        <option value="">Start from scratch</option>
                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-muted)]">Recipe Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className={`luxury-input w-full mt-1 ${errors.name ? 'border-[var(--color-destructive)]' : ''}`} />
                        {errors.name && <p className="text-[var(--color-destructive)] text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-muted)]">Category</label>
                         <input
                            type="text"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="e.g., Main Course"
                            className={`luxury-input w-full mt-1 ${errors.category ? 'border-[var(--color-destructive)]' : ''}`}
                            list="recipe-categories"
                        />
                        <datalist id="recipe-categories">
                            {categories.map((cat) => <option key={cat.id} value={cat.name} />)}
                        </datalist>
                        {errors.category && <p className="text-[var(--color-destructive)] text-xs mt-1">{errors.category}</p>}
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-muted)]">Servings</label>
                        <input type="number" min="1" value={servings} onChange={e => setServings(parseInt(e.target.value) || 1)} className={`luxury-input w-full mt-1 ${errors.servings ? 'border-[var(--color-destructive)]' : ''}`} />
                        {errors.servings && <p className="text-[var(--color-destructive)] text-xs mt-1">{errors.servings}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-muted)]">Target Sale Price/Serving</label>
                        <input type="number" min="0" step="0.01" value={targetSalePricePerServing} onChange={e => setTargetSalePrice(parseFloat(e.target.value) || 0)} className="luxury-input w-full mt-1" />
                    </div>
                </div>
                <div>
                    <h4 className="text-sm font-medium mb-2 text-[var(--color-text-muted)]">Ingredients</h4>
                    {errors.ingredients && <p className="text-[var(--color-destructive)] text-xs mb-2">{errors.ingredients}</p>}
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                       {ingredients.map((ing, index) => (
                           <div key={index} className="grid grid-cols-[1fr,100px,80px,auto] gap-2 items-center">
                               <select value={ing.itemId} onChange={e => handleIngredientChange(index, 'itemId', e.target.value)} className="luxury-select w-full">
                                   {inventory.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                               </select>
                               <input type="number" value={ing.quantity} onChange={e => handleIngredientChange(index, 'quantity', e.target.value)} className="luxury-input w-full" />
                               <select value={ing.unit} onChange={e => handleIngredientChange(index, 'unit', e.target.value)} className="luxury-select w-full">
                                   {allUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                               </select>
                               <button onClick={() => handleRemoveIngredient(index)} className="text-[var(--color-destructive)]/80 hover:text-[var(--color-destructive)]"><X size={18} /></button>
                           </div>
                       ))}
                    </div>
                    <button onClick={handleAddIngredient} className="text-sm text-[var(--color-primary)] mt-2 flex items-center"><PlusCircle size={16} className="mr-1"/> Add Ingredient</button>
                </div>

                <div className="bg-[var(--color-secondary)] p-3 rounded-lg text-sm mt-4 border border-[var(--color-border)]">
                    <div className="flex justify-between items-center">
                        <span className="text-[var(--color-text-muted)]">Calculated Total Cost:</span>
                        <span className="font-semibold">{formatCurrency(recipeCost)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                        <span className="text-[var(--color-text-muted)]">Cost per Serving:</span>
                        <span className="font-semibold">{formatCurrency(costPerServing)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-[var(--color-border)]">
                         <div className="text-[var(--color-text-muted)]">
                            <span className="font-medium">Suggested Sale Price</span>
                            <p className="text-xs">Based on a 30% food cost target.</p>
                        </div>
                        <span className="font-bold text-lg text-[var(--color-primary)]">{formatCurrency(suggestedPrice)}</span>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mt-4 text-[var(--color-text-muted)]">Instructions (one step per line)</label>
                    <textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={5} className="luxury-input w-full mt-1"></textarea>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                    <button onClick={handleClose} className="luxury-btn luxury-btn-secondary">Cancel</button>
                    <button onClick={handleSave} className="luxury-btn luxury-btn-primary">Save Recipe</button>
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

    const handleAdd = async () => {
        if (newCategoryName.trim()) {
            await addCategory(newCategoryName.trim());
            setNewCategoryName('');
        }
    };

    const handleUpdate = async () => {
        if (editingCategory && editingCategory.name.trim()) {
            await updateCategory(editingCategory.id, editingCategory.name.trim());
            setEditingCategory(null);
        }
    };
    
    const handleDelete = async (id: string) => {
        const result = await deleteCategory(id);
        if(!result.success) {
            alert(result.message);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Manage Recipe Categories">
            <div className="space-y-4">
                <div>
                    <h3 className="text-md font-semibold mb-2 text-[var(--color-text-muted)]">Add New Category</h3>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="e.g., Desserts"
                            className="luxury-input flex-grow"
                        />
                        <button onClick={handleAdd} className="luxury-btn luxury-btn-primary disabled:opacity-50" disabled={!newCategoryName.trim()}>Add</button>
                    </div>
                </div>
                <div>
                    <h3 className="text-md font-semibold mb-2 text-[var(--color-text-muted)]">Existing Categories</h3>
                    <ul className="space-y-2 max-h-60 overflow-y-auto border border-[var(--color-border)] rounded-md p-2 bg-[var(--color-secondary)]">
                        {categories.map(cat => (
                            <li key={cat.id} className="flex items-center justify-between p-2 hover:bg-[var(--color-border)] rounded">
                                {editingCategory?.id === cat.id ? (
                                    <input
                                        type="text"
                                        value={editingCategory.name}
                                        onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                        onBlur={handleUpdate}
                                        onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                                        className="luxury-input p-1 w-full"
                                        autoFocus
                                    />
                                ) : (
                                    <span>{cat.name}</span>
                                )}
                                <div className="space-x-2">
                                     <button onClick={() => setEditingCategory(cat)} className="text-[var(--color-primary)] hover:opacity-80"><Edit3 size={16} /></button>
                                     <button onClick={() => handleDelete(cat.id)} className="text-[var(--color-destructive)] hover:opacity-80"><Trash2 size={16} /></button>
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

    const handleAdd = async () => {
        if (newUnitName.trim()) {
            await addUnit(newUnitName.trim());
            setNewUnitName('');
        }
    };

    const handleUpdate = async () => {
        if (editingUnit && editingUnit.name.trim()) {
            await updateUnit(editingUnit.id, editingUnit.name.trim());
            setEditingUnit(null);
        }
    };
    
    const handleDelete = async (id: string) => {
        const result = await deleteUnit(id);
        if(!result.success) {
            alert(result.message);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Manage Ingredient Units">
            <div className="space-y-4">
                <div>
                    <h3 className="text-md font-semibold mb-2 text-[var(--color-text-muted)]">Add New Unit</h3>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={newUnitName}
                            onChange={(e) => setNewUnitName(e.target.value)}
                            placeholder="e.g., pinch, bunch"
                            className="luxury-input flex-grow"
                        />
                        <button onClick={handleAdd} className="luxury-btn luxury-btn-primary disabled:opacity-50" disabled={!newUnitName.trim()}>Add</button>
                    </div>
                </div>
                <div>
                    <h3 className="text-md font-semibold mb-2 text-[var(--color-text-muted)]">Custom Units</h3>
                    <ul className="space-y-2 max-h-60 overflow-y-auto border border-[var(--color-border)] rounded-md p-2 bg-[var(--color-secondary)]">
                        {ingredientUnits.map(unit => (
                            <li key={unit.id} className="flex items-center justify-between p-2 hover:bg-[var(--color-border)] rounded">
                                {editingUnit?.id === unit.id ? (
                                    <input
                                        type="text"
                                        value={editingUnit.name}
                                        onChange={(e) => setEditingUnit({ ...editingUnit, name: e.target.value })}
                                        onBlur={handleUpdate}
                                        onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                                        className="luxury-input p-1 w-full"
                                        autoFocus
                                    />
                                ) : (
                                    <span>{unit.name}</span>
                                )}
                                <div className="space-x-2">
                                     <button onClick={() => setEditingUnit(unit)} className="text-[var(--color-primary)] hover:opacity-80"><Edit3 size={16} /></button>
                                     <button onClick={() => handleDelete(unit.id)} className="text-[var(--color-destructive)] hover:opacity-80"><Trash2 size={16} /></button>
                                </div>
                            </li>
                        ))}
                         {ingredientUnits.length === 0 && <li className="text-center text-[var(--color-text-muted)] py-2">No custom units created yet.</li>}
                    </ul>
                </div>
            </div>
        </Modal>
    );
}


const Recipes: React.FC = () => {
    const { recipes, getInventoryItemById, updateRecipe, deleteRecipe, addRecipe, recordRecipeCostHistory, duplicateRecipe, calculateRecipeCost, activeBusinessId, categories, recipeTemplates, addRecipeTemplate, inventory, getConversionFactor, ingredientUnits, uploadRecipeImage, removeRecipeImage, bulkAddRecipes } = useData();
    const { formatCurrency } = useCurrency();
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [isNewRecipeModalOpen, setIsNewRecipeModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
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

    useEffect(() => {
        // Sync local selectedRecipe with the master list from context, especially after an update like an image upload.
        if (selectedRecipe) {
            const updatedRecipeFromContext = recipes.find(r => r.id === selectedRecipe.id);
            // Use stringify for a simple but effective deep-ish comparison to prevent infinite loops.
            if (updatedRecipeFromContext && JSON.stringify(updatedRecipeFromContext) !== JSON.stringify(selectedRecipe)) {
                setSelectedRecipe(updatedRecipeFromContext);
            }
        }
    }, [recipes, selectedRecipe]);

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

    const handleConfirmDelete = async () => {
        if (!selectedRecipe) return;
        const result = await deleteRecipe(selectedRecipe.id);
        if (result.success) {
             const newSelected = recipes.length > 1 ? recipes.filter(r => r.id !== selectedRecipe.id)[0] : null;
             setSelectedRecipe(newSelected);
        } else {
             setDeleteError(result.message || 'An unknown error occurred.');
        }
    };

    const handleConfirmDuplicate = async (includeHistory: boolean) => {
        if (!selectedRecipe) return;
        const newRecipe = await duplicateRecipe(selectedRecipe.id, includeHistory);
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

    const handleExport = () => {
        const headers = ['recipeName', 'category', 'servings', 'instructions', 'targetSalePricePerServing', 'ingredientName', 'ingredientQuantity', 'ingredientUnit'];
        
        const dataToExport: any[] = [];
        recipes.forEach(recipe => {
            if (recipe.ingredients.length === 0) {
                dataToExport.push({
                    recipeName: recipe.name,
                    category: recipe.category,
                    servings: recipe.servings,
                    instructions: recipe.instructions.join('|'), // Use a separator for multi-line
                    targetSalePricePerServing: recipe.targetSalePricePerServing || 0,
                    ingredientName: '',
                    ingredientQuantity: '',
                    ingredientUnit: '',
                });
            } else {
                recipe.ingredients.forEach(ing => {
                    const item = getInventoryItemById(ing.itemId);
                    dataToExport.push({
                        recipeName: recipe.name,
                        category: recipe.category,
                        servings: recipe.servings,
                        instructions: recipe.instructions.join('|'),
                        targetSalePricePerServing: recipe.targetSalePricePerServing || 0,
                        ingredientName: item ? item.name : 'N/A',
                        ingredientQuantity: ing.quantity,
                        ingredientUnit: ing.unit,
                    });
                });
            }
        });

        const csvString = convertToCSV(dataToExport, headers);
        downloadCSV(csvString, 'recipes.csv');
    };

    type ParsedRecipeRow = {
        recipeName: string;
        category: string;
        servings: number;
        instructions: string[];
        targetSalePricePerServing: number;
        ingredients: Ingredient[];
    };
    
    const parseRecipeFile = async (fileContent: string): Promise<{ data: Omit<Recipe, 'id' | 'businessId'>[]; errors: string[] }> => {
        const lines = fileContent.trim().split('\n');
        const headers = lines[0].trim().split(',').map(h => h.replace(/"/g, '').trim());
        const requiredHeaders = ['recipeName', 'category', 'servings', 'ingredientName', 'ingredientQuantity', 'ingredientUnit'];
        const errors: string[] = [];
        
        requiredHeaders.forEach(h => {
            if (!headers.includes(h)) errors.push(`Missing required header: ${h}`);
        });
        if(errors.length > 0) return { data: [], errors };

        const inventoryNameMap = new Map(inventory.map(i => [i.name.toLowerCase(), i.id]));
        const recipesMap = new Map<string, ParsedRecipeRow>();

        lines.slice(1).forEach((line, index) => {
            const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
            const row: any = {};
            headers.forEach((header, i) => row[header] = values[i]);

            const recipeName = String(row.recipeName || '');
            if (!recipeName) return;

            if (!recipesMap.has(recipeName.toLowerCase())) {
                recipesMap.set(recipeName.toLowerCase(), {
                    recipeName: recipeName,
                    category: row.category,
                    servings: parseFloat(row.servings) || 1,
                    instructions: row.instructions ? row.instructions.split('|') : [],
                    targetSalePricePerServing: parseFloat(row.targetSalePricePerServing) || 0,
                    ingredients: [],
                });
            }

            const ingredientName = String(row.ingredientName || '');
            if (ingredientName) {
                const itemId = inventoryNameMap.get(ingredientName.toLowerCase());
                if (itemId) {
                    const recipe = recipesMap.get(recipeName.toLowerCase());
                    if (recipe) {
                         recipe.ingredients.push({
                            itemId: itemId,
                            quantity: parseFloat(row.ingredientQuantity) || 0,
                            unit: row.ingredientUnit,
                        });
                    }
                } else {
                    errors.push(`Row ${index + 2}: Ingredient "${ingredientName}" not found in inventory.`);
                }
            }
        });
        
        const data = Array.from(recipesMap.values()).map(r => ({
            name: r.recipeName,
            category: r.category,
            servings: r.servings,
            instructions: r.instructions,
            targetSalePricePerServing: r.targetSalePricePerServing,
            ingredients: r.ingredients,
        }));
        
        return { data, errors };
    };

    const handleImport = (data: Omit<Recipe, 'id' | 'businessId'>[]) => {
        return bulkAddRecipes(data);
    };


    const selectedRecipeCost = selectedRecipe ? calculateRecipeCost(selectedRecipe) : 0;
    const selectedCostPerServing = (selectedRecipe && selectedRecipe.servings > 0) ? selectedRecipeCost / selectedRecipe.servings : 0;
    const suggestedSalePrice = selectedCostPerServing > 0 ? selectedCostPerServing / 0.30 : 0;

    return (
        <>
        <RecipeFormModal isOpen={isNewRecipeModalOpen} onClose={() => setIsNewRecipeModalOpen(false)} onSave={addRecipe} categories={categories} templates={recipeTemplates} />
        <CategoryManagerModal isOpen={modalState.type === 'manageCategories'} onClose={() => setModalState({ type: null })} />
        <UnitManagerModal isOpen={modalState.type === 'manageUnits'} onClose={() => setModalState({ type: null })} />
        <ImportModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            title="Import Recipes"
            templateUrl="data:text/csv;charset=utf-8,recipeName,category,servings,instructions,targetSalePricePerServing,ingredientName,ingredientQuantity,ingredientUnit%0ASoup,Appetizers,4,Step%201%7CStep%202,10,Carrot,1,kg%0ASoup,Appetizers,4,Step%201%7CStep%202,10,Onion,2,unit"
            templateFilename="recipes_template.csv"
            parseFile={parseRecipeFile}
            onImport={handleImport}
            renderPreview={(recipe: any, index) => (
                <div key={index} className="p-2 text-sm">
                    <p className="font-semibold">{recipe.name} ({recipe.servings} servings)</p>
                    <p className="text-[var(--color-text-muted)]">{recipe.ingredients.length} ingredients</p>
                </div>
            )}
        />


        {selectedRecipe && <>
            <ConfirmationModal
                isOpen={modalState.type === 'delete'}
                onClose={() => { setModalState({ type: null }); setDeleteError(null); }}
                onConfirm={handleConfirmDelete}
                title="Delete Recipe"
                message={deleteError ? <span className="text-red-700">{deleteError}</span> : `Are you sure you want to permanently delete "${selectedRecipe.name}"? This action cannot be undone.`}
                confirmText={deleteError ? 'OK' : 'Delete'}
                confirmButtonClass={deleteError ? 'luxury-btn luxury-btn-primary' : 'luxury-btn bg-[var(--color-destructive)] text-white hover:bg-opacity-80'}
                cancelText={deleteError ? '' : 'Cancel'}
            />
            <Modal isOpen={modalState.type === 'duplicate'} onClose={() => setModalState({ type: null })} title="Duplicate Recipe">
                <div>
                    <p className="mb-4">Do you want to include the cost history in the new duplicated recipe?</p>
                    <div className="flex justify-end space-x-2">
                        <button onClick={() => { handleConfirmDuplicate(false); setModalState({ type: null }); }} className="luxury-btn luxury-btn-secondary">No, Start Fresh</button>
                        <button onClick={() => { handleConfirmDuplicate(true); setModalState({ type: null }); }} className="luxury-btn luxury-btn-primary">Yes, Include History</button>
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
                    <label htmlFor="templateName" className="block text-sm font-medium text-[var(--color-text-muted)]">Template Name</label>
                    <input type="text" name="templateName" id="templateName" defaultValue={`${selectedRecipe.name} Base`} className="luxury-input mt-1 block w-full" required />
                    <div className="flex justify-end space-x-2 pt-4 mt-2">
                        <button type="button" onClick={() => setModalState({ type: null })} className="luxury-btn luxury-btn-secondary">Cancel</button>
                        <button type="submit" className="luxury-btn luxury-btn-primary">Save Template</button>
                    </div>
                </form>
            </Modal>
        </>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`${selectedRecipe ? 'hidden lg:block' : 'block'} lg:col-span-1`}>
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Recipes</h2>
                        <div className="flex items-center space-x-1">
                            <ActionsDropdown onExport={handleExport} onImport={() => setIsImportModalOpen(true)} />
                            <button onClick={() => setIsNewRecipeModalOpen(true)} className="flex items-center text-[var(--color-primary)] hover:opacity-80 p-2 rounded-lg" title="New Recipe">
                                <PlusCircle size={22} />
                            </button>
                        </div>
                    </div>
                     <div className="mb-4 space-y-3">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search recipes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="luxury-input w-full pl-10"
                                aria-label="Search recipes by name"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={20} />
                        </div>
                        <div className="flex items-center space-x-2">
                             <select
                                id="category-filter"
                                value={filterCategory}
                                onChange={e => setFilterCategory(e.target.value)}
                                className="luxury-select block w-full"
                                aria-label="Filter by category"
                            >
                                <option value="all">All Categories</option>
                                {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                            </select>
                            <button onClick={() => setModalState({ type: 'manageCategories' })} className="p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-background)] hover:bg-[var(--color-secondary)]" title="Manage Categories">
                               <ListChecks size={20} className="text-[var(--color-text-muted)]"/>
                            </button>
                             <button onClick={() => setModalState({ type: 'manageUnits' })} className="p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-background)] hover:bg-[var(--color-secondary)]" title="Manage Units">
                               <Weight size={20} className="text-[var(--color-text-muted)]"/>
                            </button>
                        </div>
                    </div>
                    <ul className="space-y-2 max-h-[calc(65vh-120px)] overflow-y-auto">
                        {filteredRecipes.map(recipe => (
                            <li
                                key={recipe.id}
                                className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedRecipe?.id === recipe.id ? 'bg-[var(--color-primary)]/10' : 'hover:bg-[var(--color-secondary)]'}`}
                                onClick={() => { setSelectedRecipe(recipe); setIsHistoryVisible(false); }}
                            >
                                <div className="font-semibold">{recipe.name}</div>
                                <div className="text-xs text-[var(--color-text-muted)] mt-1">Cost/Serving: {formatCurrency(calculateRecipeCost(recipe) / (recipe.servings || 1))}</div>
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
                                className="lg:hidden flex items-center text-sm text-[var(--color-primary)] hover:opacity-80 font-semibold mb-3 -ml-1"
                            >
                                <ChevronLeft size={20} />
                                Back to list
                            </button>
                            <div className="flex justify-between items-start mb-4">
                                 <h2 className="text-2xl font-bold">{selectedRecipe.name}</h2>
                                 <div className="flex items-center space-x-2">
                                    <button onClick={() => setModalState({ type: 'saveTemplate'})} className="p-2 rounded-full hover:bg-[var(--color-secondary)]" title="Save as Template">
                                        <FileText size={20} className="text-[var(--color-primary)]" />
                                    </button>
                                    <button onClick={() => setModalState({ type: 'duplicate'})} className="p-2 rounded-full hover:bg-[var(--color-secondary)]" title="Duplicate Recipe">
                                        <Copy size={20} className="text-[var(--color-primary)]" />
                                    </button>
                                    <button onClick={() => setModalState({ type: 'delete'})} className="p-2 rounded-full hover:bg-[var(--color-secondary)]" title="Delete Recipe">
                                        <Trash2 size={20} className="text-[var(--color-destructive)]" />
                                    </button>
                                 </div>
                            </div>

                            <div className="relative group w-full h-48 bg-[var(--color-secondary)] rounded-lg mb-4 flex items-center justify-center overflow-hidden border border-dashed border-[var(--color-border)]">
                                {isUploading ? (
                                    <div className="flex flex-col items-center text-[var(--color-primary)]">
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
                                    <label htmlFor="image-upload" className="cursor-pointer text-center text-[var(--color-text-muted)] p-4 rounded-lg hover:bg-[var(--color-border)] transition-colors w-full h-full flex flex-col justify-center items-center">
                                        <UploadCloud size={32} className="mx-auto" />
                                        <span className="mt-2 block text-sm font-semibold text-[var(--color-primary)]">Upload an image</span>
                                        <p className="text-xs">PNG, JPG up to 5MB</p>
                                        <input id="image-upload" type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleImageUpload} />
                                    </label>
                                )}
                            </div>


                            {suggestedSalePrice > 0 && (
                                <div className="bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 p-4 rounded-lg mb-6 flex items-center">
                                    <Lightbulb className="text-[var(--color-primary)] mr-4 flex-shrink-0" size={24} />
                                    <div>
                                        <p className="font-semibold text-[var(--color-primary)]">Suggested Sale Price: {formatCurrency(suggestedSalePrice)}</p>
                                        <p className="text-sm text-[var(--color-text-muted)]">This suggestion is based on a 30% food cost target, a common industry benchmark for profitability.</p>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6">
                                <button
                                    onClick={() => setIsHistoryVisible(!isHistoryVisible)}
                                    className="flex items-center justify-between w-full p-3 bg-[var(--color-secondary)] hover:bg-[var(--color-border)] rounded-lg border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                    aria-expanded={isHistoryVisible}
                                >
                                    <div className="flex items-center">
                                        <TrendingUp className="mr-2 text-[var(--color-primary)]" size={20} />
                                        <h3 className="text-lg font-semibold">Cost History</h3>
                                    </div>
                                    {isHistoryVisible ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </button>
                                {isHistoryVisible && (
                                    <div className="mt-4 p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-background)]">
                                        {selectedRecipe.costHistory && selectedRecipe.costHistory.length > 1 ? (
                                            <ResponsiveContainer width="100%" height={250}>
                                                <LineChart data={selectedRecipe.costHistory} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                                    <XAxis 
                                                        dataKey="date" 
                                                        tickFormatter={(dateStr) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                                                    />
                                                    <YAxis 
                                                        tickFormatter={(value) => formatCurrency(value)}
                                                        domain={['dataMin - 5', 'dataMax + 5']}
                                                        tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                                                    />
                                                    <Tooltip 
                                                        formatter={(value: number) => [formatCurrency(value), 'Total Cost']}
                                                        labelFormatter={(dateStr) => new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                        contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                                                    />
                                                    <Line type="monotone" dataKey="cost" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 4, fill: 'var(--color-primary)' }} activeDot={{ r: 6, fill: 'var(--color-primary)' }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <p className="text-center text-[var(--color-text-muted)] py-4">Not enough data to display cost history chart.</p>
                                        )}
                                    </div>
                                )}
                            </div>

                             <div className="flex justify-between items-center mt-6 mb-2">
                                 <h3 className="text-lg font-semibold">Ingredients</h3>
                                 <button onClick={handleAddIngredientToRecipe} className="flex items-center text-sm text-[var(--color-primary)] hover:opacity-80">
                                    <Plus size={16} className="mr-1" /> Add Ingredient
                                </button>
                            </div>
                            <div className="border border-[var(--color-border)] rounded-lg">
                                <div className="hidden md:grid md:grid-cols-[1fr,100px,120px,100px,40px] gap-x-2 px-3 py-2 text-sm bg-[var(--color-secondary)] text-[var(--color-text-muted)] font-semibold">
                                    <span>Ingredient</span>
                                    <span>Quantity</span>
                                    <span>Unit</span>
                                    <span className="text-right">Cost</span>
                                    <span></span>
                                </div>
                                <div className="divide-y md:divide-y-0 divide-[var(--color-border)]">
                                    {selectedRecipe.ingredients.map((ing, index) => {
                                        const item = getInventoryItemById(ing.itemId);
                                        const costConversionFactor = item ? getConversionFactor(ing.unit, item.unit) || 1 : 1;
                                        const ingredientCost = item ? item.unitCost * ing.quantity * costConversionFactor : 0;
                                        
                                        return (
                                            <div key={`${ing.itemId}-${index}`} className="p-3 md:p-2 md:grid md:grid-cols-[1fr,100px,120px,100px,40px] md:gap-x-2 md:items-center hover:bg-[var(--color-secondary)] space-y-2 md:space-y-0">
                                                <div>
                                                    <label className="text-xs font-medium text-[var(--color-text-muted)] md:hidden">Ingredient</label>
                                                    <select value={ing.itemId} onChange={e => handleIngredientChange(index, 'itemId', e.target.value)} className="luxury-select w-full text-sm">
                                                        {inventory.map(invItem => <option key={invItem.id} value={invItem.id}>{invItem.name}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-[var(--color-text-muted)] md:hidden">Quantity</label>
                                                    <input type="number" value={ing.quantity} onChange={e => handleIngredientChange(index, 'quantity', e.target.value)} className="luxury-input w-full text-sm" />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-[var(--color-text-muted)] md:hidden">Unit</label>
                                                    <select value={ing.unit} onChange={e => handleIngredientChange(index, 'unit', e.target.value)} className="luxury-select w-full text-sm">
                                                        {allUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                                                    </select>
                                                </div>
                                                <div className="flex justify-between items-center md:block md:text-right">
                                                    <label className="text-xs font-medium text-[var(--color-text-muted)] md:hidden">Cost</label>
                                                    {item ? (
                                                        <div className="flex flex-col items-end">
                                                            <span className="font-medium text-sm">{formatCurrency(ingredientCost)}</span>
                                                            <span className="text-xs text-[var(--color-text-muted)]">
                                                                {formatCurrency(item.unitCost)} / {item.unit}
                                                            </span>
                                                        </div>
                                                    ) : <span className="text-[var(--color-destructive)] text-xs">Item not found</span>}
                                                </div>
                                                <div className="flex justify-end md:justify-center">
                                                    <button onClick={() => handleRemoveIngredientFromRecipe(index)} className="text-[var(--color-destructive)]/70 hover:text-[var(--color-destructive)]"><XCircle size={18} /></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="font-semibold border-t-2 border-[var(--color-border)]">
                                    <div className="flex justify-between items-center p-3">
                                        <span className="text-right text-lg">Total Recipe Cost:</span>
                                        <span className="text-right text-lg">{formatCurrency(selectedRecipeCost)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-[var(--color-primary)]/5">
                                        <span className="text-right text-[var(--color-primary)] text-lg">Cost per Serving:</span>
                                        <span className="text-right text-[var(--color-primary)] text-lg">{formatCurrency(selectedCostPerServing)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center mt-6 mb-2">
                                 <h3 className="text-lg font-semibold">Instructions</h3>
                                 <button onClick={handleAddInstruction} className="flex items-center text-sm text-[var(--color-primary)] hover:opacity-80">
                                    <Plus size={16} className="mr-1" /> Add Step
                                </button>
                            </div>
                            <ol className="list-decimal list-inside space-y-2">
                               {selectedRecipe.instructions.map((instruction, index) => (
                                   <li 
                                       key={index} 
                                       className={`flex items-start group p-2 rounded-md transition-shadow ${draggedIndex === index ? 'shadow-lg bg-[var(--color-primary)]/10' : ''}`}
                                       draggable
                                       onDragStart={() => { dragItem.current = index; setDraggedIndex(index); }}
                                       onDragEnter={() => dragOverItem.current = index}
                                       onDragEnd={handleDragSort}
                                       onDragOver={(e) => e.preventDefault()}
                                    >
                                       <GripVertical className="mr-2 text-[var(--color-text-muted)] cursor-grab flex-shrink-0 mt-1" size={18} />
                                       <span className="mr-2 text-[var(--color-text-muted)] font-semibold mt-1">{index + 1}.</span>
                                       <textarea 
                                            value={instruction}
                                            onChange={(e) => handleInstructionChange(index, e.target.value)}
                                            rows={Math.max(1, Math.ceil(instruction.length / 50))}
                                            className="flex-grow p-1 border border-transparent hover:border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] rounded-md transition-colors w-full text-[var(--color-text-muted)] bg-transparent resize-none"
                                       />
                                       <button onClick={() => handleRemoveInstruction(index)} className="ml-2 text-[var(--color-destructive)]/60 hover:text-[var(--color-destructive)] opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                                           <XCircle size={18} />
                                       </button>
                                   </li>
                               ))}
                            </ol>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-muted)] p-8 text-center">
                            <FileText size={48} className="mb-4 text-[var(--color-border)]" />
                            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">No Recipe Selected</h3>
                            <p className="max-w-xs mt-1">Select a recipe from the list to view its details, or create a new one to get started.</p>
                             <button onClick={() => setIsNewRecipeModalOpen(true)} className="mt-4 luxury-btn luxury-btn-primary">
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