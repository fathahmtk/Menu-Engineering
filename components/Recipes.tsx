
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Card from './common/Card';
import Modal from './common/Modal';
import ConfirmationModal from './common/ConfirmationModal';
import { useData } from '../hooks/useDataContext';
import { useCurrency } from '../hooks/useCurrencyContext';
import { PlusCircle, Trash2, Edit, Plus, X, XCircle, Search, GripVertical, CheckCircle, TrendingUp, ChevronDown, ChevronUp, Copy, FileText, Save, ListChecks, Edit3, UploadCloud, Loader2, Weight, ChevronLeft, Download, Info, DollarSign, PieChart, ClipboardList, Settings, SlidersHorizontal } from 'lucide-react';
import { Recipe, Ingredient, RecipeCategory, RecipeTemplate, IngredientType, PricedItem } from '../types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import ActionsDropdown from './common/ActionsDropdown';
import ImportModal from './common/ImportModal';
import { convertToCSV, downloadCSV } from '../utils/csvHelper';
import { useNotification } from '../hooks/useNotificationContext';
import { useUnsavedChanges } from '../hooks/useUnsavedChangesContext';
import { generateCostingSheetSVG } from '../utils/costingSheetGenerator';
import { useAppSettings } from '../hooks/useAppSettings';

const DEFAULT_UNITS: string[] = ['kg', 'g', 'L', 'ml', 'unit', 'dozen'];

// Sub-components for Modals to keep main component cleaner
const RecipeFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (recipe: Omit<Recipe, 'id' | 'businessId'>) => void;
    categories: RecipeCategory[];
    templates: RecipeTemplate[];
    initialData?: Partial<Omit<Recipe, 'id' | 'businessId'>>;
}> = ({ isOpen, onClose, onSave, categories, templates, initialData }) => {
    const { pricedItems, recipes, calculateRecipeCost, ingredientUnits } = useData();
    const { formatCurrency } = useCurrency();
    const { settings } = useAppSettings();
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [servings, setServings] = useState(1);
    const [targetSalePricePerServing, setTargetSalePrice] = useState(0);
    const [productionYield, setProductionYield] = useState<number | undefined>();
    const [productionUnit, setProductionUnit] = useState<string | undefined>('');
    const [instructions, setInstructions] = useState('');
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    
    const allUnits = useMemo(() => {
        return [...new Set([...DEFAULT_UNITS, ...ingredientUnits.map(u => u.name)])]
    }, [ingredientUnits]);

    const subRecipes = useMemo(() => recipes, [recipes]);

    const recipeCost = useMemo(() => {
        const tempRecipe: Recipe = { id: '', name, category, servings, ingredients, instructions: [], businessId: '', labourMinutes: 0, packagingCostPerServing: 0, labourCostMethod: 'blended' };
        return calculateRecipeCost(tempRecipe);
    }, [ingredients, name, category, servings, calculateRecipeCost]);

    const costPerServing = servings > 0 ? recipeCost / servings : 0;
    const foodCostTarget = settings.foodCostTarget > 0 ? settings.foodCostTarget / 100 : 0.3;
    const suggestedPrice = costPerServing > 0 ? costPerServing / foodCostTarget : 0;

    const resetForm = useCallback(() => {
        setName('');
        setCategory(categories.length > 0 ? categories[0].name : '');
        setServings(1);
        setTargetSalePrice(0);
        setProductionYield(undefined);
        setProductionUnit('');
        setInstructions('');
        setIngredients([]);
        setErrors({});
    }, [categories]);

    useEffect(() => {
        if(isOpen) {
            if (initialData) {
                setName(initialData.name || '');
                setCategory(initialData.category || (categories.length > 0 ? categories[0].name : ''));
                setServings(initialData.servings || 1);
                setTargetSalePrice(initialData.targetSalePricePerServing || 0);
                setProductionYield(initialData.productionYield);
                setProductionUnit(initialData.productionUnit);
                setInstructions(initialData.instructions?.join('\n') || '');
                setIngredients(initialData.ingredients || []);
                setErrors({});
            } else {
                resetForm();
            }
        }
    }, [isOpen, initialData, resetForm, categories]);


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
        setProductionYield(recipeData.productionYield);
        setProductionUnit(recipeData.productionUnit);
        setIngredients(recipeData.ingredients);
        setInstructions(recipeData.instructions.join('\n'));
    };

    const handleClose = () => {
        onClose();
    };

    const handleAddIngredient = () => {
        if (pricedItems.length > 0) {
            setIngredients([...ingredients, { id: crypto.randomUUID(), type: 'item', itemId: pricedItems[0].id, quantity: 1, unit: 'g', yieldPercentage: 100 }]);
        }
    };
    
    const handleIngredientChange = (index: number, field: keyof Ingredient, value: any) => {
        const newIngredients = [...ingredients];
        if (field === 'itemId') {
            const [type, id] = value.split('::');
            const selectedItem = type === 'item' ? pricedItems.find(i => i.id === id) : recipes.find(r => r.id === id);
            
            newIngredients[index] = { ...newIngredients[index], type, itemId: id };

            if(type === 'item' && selectedItem) {
                 newIngredients[index].unit = (selectedItem as PricedItem).unit;
            } else if (type === 'recipe' && selectedItem) {
                 newIngredients[index].unit = (selectedItem as Recipe).productionUnit || 'unit';
            }

        } else {
            newIngredients[index] = { ...newIngredients[index], [field]: value };
        }
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
        
        onSave({ name, category, servings, targetSalePricePerServing, productionYield, productionUnit, ingredients, instructions: instructionSteps, labourMinutes: 0, packagingCostPerServing: 0, labourCostMethod: 'blended' });
        handleClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Create New Recipe">
             <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-muted)]">Use a Template (Optional)</label>
                    <select
                        onChange={(e) => handleTemplateSelect(e.target.value)}
                        className="ican-select mt-1"
                        defaultValue=""
                    >
                        <option value="">Start from scratch</option>
                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-muted)]">Recipe Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className={`ican-input mt-1 ${errors.name ? 'border-[var(--color-danger)]' : ''}`} />
                        {errors.name && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-muted)]">Category</label>
                         <input
                            type="text"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="e.g., Main Course"
                            className={`ican-input mt-1 ${errors.category ? 'border-[var(--color-danger)]' : ''}`}
                            list="recipe-categories"
                        />
                        <datalist id="recipe-categories">
                            {categories.map((cat) => <option key={cat.id} value={cat.name} />)}
                        </datalist>
                        {errors.category && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.category}</p>}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-muted)]">Servings</label>
                        <input type="number" min="1" value={servings} onChange={e => setServings(parseInt(e.target.value) || 1)} className={`ican-input mt-1 ${errors.servings ? 'border-[var(--color-danger)]' : ''}`} />
                        {errors.servings && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.servings}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-muted)]">Target Sale Price/Serving</label>
                        <input type="number" min="0" step="0.01" value={targetSalePricePerServing} onChange={e => setTargetSalePrice(parseFloat(e.target.value) || 0)} className="ican-input mt-1" />
                    </div>
                </div>
                <div>
                     <h4 className="text-sm font-medium text-[var(--color-text-muted)]">Production Details (for Sub-Recipes)</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                        <div>
                            <label className="block text-xs font-medium text-[var(--color-text-muted)]">Production Yield</label>
                            <input type="number" min="0" value={productionYield || ''} onChange={e => setProductionYield(parseFloat(e.target.value) || undefined)} className="ican-input mt-1" placeholder="e.g. 5" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[var(--color-text-muted)]">Production Unit</label>
                            <input type="text" value={productionUnit || ''} onChange={e => setProductionUnit(e.target.value)} className="ican-input mt-1" placeholder="e.g. kg, L" />
                        </div>
                    </div>
                </div>
                <div>
                    <h4 className="text-sm font-medium mb-2 text-[var(--color-text-muted)]">Ingredients</h4>
                    {errors.ingredients && <p className="text-[var(--color-danger)] text-xs mb-2">{errors.ingredients}</p>}
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                       {ingredients.map((ing, index) => (
                           <div key={ing.id} className="grid grid-cols-[1fr,80px,80px,80px,auto] gap-2 items-center">
                               <select value={`${ing.type}::${ing.itemId}`} onChange={e => handleIngredientChange(index, 'itemId', e.target.value)} className="ican-select">
                                   <optgroup label="Priced Items">
                                    {pricedItems.map(item => <option key={item.id} value={`item::${item.id}`}>{item.name}</option>)}
                                   </optgroup>
                                   <optgroup label="Sub-Recipes">
                                     {subRecipes.map(item => <option key={item.id} value={`recipe::${item.id}`}>{item.name}</option>)}
                                   </optgroup>
                               </select>
                               <input type="number" value={ing.quantity} onChange={e => handleIngredientChange(index, 'quantity', parseFloat(e.target.value) || 0)} className="ican-input" placeholder="Qty"/>
                               <select value={ing.unit} onChange={e => handleIngredientChange(index, 'unit', e.target.value)} className="ican-select">
                                   {allUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                               </select>
                               <input type="number" value={ing.yieldPercentage || 100} onChange={e => handleIngredientChange(index, 'yieldPercentage', parseFloat(e.target.value) || 0)} className="ican-input" placeholder="Yield %" title="Preparation Yield %"/>
                               <button onClick={() => handleRemoveIngredient(index)} className="text-[var(--color-danger)]/80 hover:text-[var(--color-danger)]"><X size={18} /></button>
                           </div>
                       ))}
                    </div>
                    <button
                        onClick={handleAddIngredient}
                        disabled={pricedItems.length === 0}
                        className={`ican-btn ican-btn-secondary py-1.5 px-3 mt-2 text-sm ${pricedItems.length === 0 ? 'ican-btn-disabled' : ''}`}
                        title={pricedItems.length === 0 ? "Add items to your price list first" : ""}
                    >
                        <PlusCircle size={16} className="mr-1.5"/> Add Ingredient
                    </button>
                </div>

                <div className="bg-[var(--color-input)] p-3 rounded-lg text-sm mt-4 border border-[var(--color-border)]">
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
                            <span className="font-medium text-[var(--color-text-secondary)]">Suggested Sale Price</span>
                            <p className="text-xs">Based on a {settings.foodCostTarget}% food cost target.</p>
                        </div>
                        <span className="font-bold text-lg text-[var(--color-primary)]">{formatCurrency(suggestedPrice)}</span>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mt-4 text-[var(--color-text-muted)]">Instructions (one step per line)</label>
                    <textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={5} className="ican-input mt-1"></textarea>
                </div>
                <div className="flex flex-col-reverse md:flex-row md:justify-end md:space-x-2 pt-4 gap-2">
                    <button onClick={handleClose} className="ican-btn ican-btn-secondary w-full md:w-auto">Cancel</button>
                    <button onClick={handleSave} className="ican-btn ican-btn-primary w-full md:w-auto">Save Recipe</button>
                </div>
            </div>
        </Modal>
    );
};

const TabButton: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center whitespace-nowrap py-3 px-4 border-b-2 font-semibold text-sm transition-colors focus:outline-none ${
            isActive
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:border-gray-300 hover:text-[var(--color-text-secondary)]'
        }`}
    >
        {icon}
        <span className="ml-2">{label}</span>
    </button>
);

const Recipes: React.FC = () => {
    const { recipes, getPricedItemById, getRecipeById, updateRecipe, deleteRecipe, addRecipe, recordRecipeCostHistory, duplicateRecipe, calculateRecipeCostBreakdown, activeBusinessId, categories, recipeTemplates, addRecipeTemplate, pricedItems, getConversionFactor, ingredientUnits, uploadRecipeImage, removeRecipeImage, bulkAddRecipes, businesses, staffMembers } = useData();
    const { formatCurrency } = useCurrency();
    const { addNotification } = useNotification();
    const { setIsDirty, promptNavigation } = useUnsavedChanges();
    const { settings } = useAppSettings();


    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [editedRecipe, setEditedRecipe] = useState<Recipe | null>(null);
    
    const [isNewRecipeModalOpen, setIsNewRecipeModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [isHistoryVisible, setIsHistoryVisible] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'ingredients' | 'instructions' | 'configuration'>('overview');
    
    const [modalState, setModalState] = useState<{ type: null | 'delete' | 'duplicate' | 'saveTemplate' } >({ type: null });
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
    
    const subRecipes = useMemo(() => recipes.filter(r => r.id !== editedRecipe?.id), [recipes, editedRecipe]);

    const handleSelectRecipe = (recipe: Recipe) => {
        promptNavigation(() => {
            setSelectedRecipe(recipe);
            setEditedRecipe(JSON.parse(JSON.stringify(recipe))); // Deep copy for editing
            setActiveTab('overview');
        });
    }
    
    const editedRecipeRef = useRef(editedRecipe);
    useEffect(() => {
        editedRecipeRef.current = editedRecipe;
    }, [editedRecipe]);

    const handleSaveChanges = useCallback(async () => {
        const recipeToSave = editedRecipeRef.current;
        if (!recipeToSave) return;
        
        if (recipeToSave.servings <= 0) {
            addNotification("Servings must be a positive number.", "error", true);
            return;
        }

        await updateRecipe(recipeToSave);
        setSelectedRecipe(recipeToSave);
        addNotification('Recipe saved successfully!', 'success');
    }, [updateRecipe, addNotification]);
    
    const isDirty = useMemo(() => JSON.stringify(selectedRecipe) !== JSON.stringify(editedRecipe), [selectedRecipe, editedRecipe]);

    useEffect(() => {
      setIsDirty(isDirty, isDirty ? handleSaveChanges : undefined);
    }, [isDirty, setIsDirty, handleSaveChanges]);

    useEffect(() => {
        if (selectedRecipe && !filteredRecipes.some(r => r.id === selectedRecipe.id)) {
            setSelectedRecipe(filteredRecipes.length > 0 ? filteredRecipes[0] : null);
            setEditedRecipe(filteredRecipes.length > 0 ? JSON.parse(JSON.stringify(filteredRecipes[0])) : null);
        } else if (!selectedRecipe && filteredRecipes.length > 0) {
            setSelectedRecipe(filteredRecipes[0]);
            setEditedRecipe(JSON.parse(JSON.stringify(filteredRecipes[0])));
        }
        
        if (selectedRecipe) {
            recordRecipeCostHistory(selectedRecipe.id);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredRecipes, recordRecipeCostHistory]);

    useEffect(() => {
        if (recipes.length > 0 && !recipes.find(r => r.id === selectedRecipe?.id)) {
            setSelectedRecipe(recipes[0]);
            setEditedRecipe(JSON.parse(JSON.stringify(recipes[0])));
        } else if (recipes.length === 0) {
            setSelectedRecipe(null);
            setEditedRecipe(null);
        }
    }, [activeBusinessId, recipes, selectedRecipe?.id]);

    useEffect(() => {
        // Sync local selectedRecipe with the master list from context
        if (selectedRecipe) {
            const updatedRecipeFromContext = recipes.find(r => r.id === selectedRecipe.id);
            if (updatedRecipeFromContext && JSON.stringify(updatedRecipeFromContext) !== JSON.stringify(selectedRecipe)) {
                // Only reset editedRecipe if not currently dirty, to avoid wiping user changes
                if(!isDirty) {
                    setSelectedRecipe(updatedRecipeFromContext);
                    setEditedRecipe(JSON.parse(JSON.stringify(updatedRecipeFromContext)));
                }
            }
        }
    }, [recipes, selectedRecipe, isDirty]);

    const handleCancelChanges = () => {
        if (selectedRecipe) {
            setEditedRecipe(JSON.parse(JSON.stringify(selectedRecipe)));
        }
    };

    const handleInstructionChange = (instIndex: number, newText: string) => {
        if (!editedRecipe) return;
        const updatedInstructions = editedRecipe.instructions.map((inst, index) => index === instIndex ? newText : inst);
        setEditedRecipe({ ...editedRecipe, instructions: updatedInstructions });
    };
    
    const handleAddInstruction = () => {
        if (!editedRecipe) return;
        setEditedRecipe({ ...editedRecipe, instructions: [...editedRecipe.instructions, 'New step'] });
    };

    const handleRemoveInstruction = (instIndex: number) => {
        if (!editedRecipe) return;
        const updatedInstructions = editedRecipe.instructions.filter((_, index) => index !== instIndex);
        setEditedRecipe({ ...editedRecipe, instructions: updatedInstructions });
    };
    
    const handleDragSort = () => {
        if (!editedRecipe || dragItem.current === null || dragOverItem.current === null) return;
        const newInstructions = [...editedRecipe.instructions];
        const draggedItemContent = newInstructions.splice(dragItem.current, 1)[0];
        newInstructions.splice(dragOverItem.current, 0, draggedItemContent);
        dragItem.current = null;
        dragOverItem.current = null;
        
        setEditedRecipe({ ...editedRecipe, instructions: newInstructions });
        setDraggedIndex(null);
    };

    const handleConfirmDelete = async () => {
        if (!selectedRecipe) return;
        const result = await deleteRecipe(selectedRecipe.id);
        if (result.success) {
             const newSelected = recipes.length > 1 ? recipes.filter(r => r.id !== selectedRecipe.id)[0] : null;
             setSelectedRecipe(newSelected);
             setEditedRecipe(newSelected ? JSON.parse(JSON.stringify(newSelected)) : null);
             addNotification('Recipe deleted successfully.', 'success');
        } else {
             setDeleteError(result.message || 'An unknown error occurred.');
        }
    };

    const handleConfirmDuplicate = async (includeHistory: boolean) => {
        if (!selectedRecipe) return;
        const newRecipe = await duplicateRecipe(selectedRecipe.id, includeHistory);
        if (newRecipe) {
            handleSelectRecipe(newRecipe);
            addNotification('Recipe duplicated.', 'success');
        }
    };

    const handleSaveAsTemplate = (templateName: string) => {
        if (!selectedRecipe || !templateName.trim()) return;
        const { id, name, costHistory, businessId, imageUrl, ...recipeData } = selectedRecipe;
        addRecipeTemplate({ name: templateName.trim(), recipeData });
        addNotification('Recipe saved as template.', 'success');
    };

    const handleIngredientChange = (ingIndex: number, field: keyof Ingredient, value: string | number) => {
        if (!editedRecipe) return;
        const newIngredients = [...editedRecipe.ingredients];
        if (field === 'itemId') {
            const [type, id] = (value as string).split('::');
            const selectedItem = type === 'item' ? pricedItems.find(i => i.id === id) : recipes.find(r => r.id === id);
            
            newIngredients[ingIndex] = { ...newIngredients[ingIndex], type: type as IngredientType, itemId: id };

            if(type === 'item' && selectedItem) {
                 newIngredients[ingIndex].unit = (selectedItem as PricedItem).unit;
            } else if (type === 'recipe' && selectedItem) {
                 newIngredients[ingIndex].unit = (selectedItem as Recipe).productionUnit || 'unit';
            }

        } else {
          (newIngredients[ingIndex] as any)[field] = value;
        }
        setEditedRecipe({ ...editedRecipe, ingredients: newIngredients });
    };

    const handleAddIngredientToRecipe = () => {
        if (!editedRecipe || pricedItems.length === 0) return;
        const newIngredient: Ingredient = { id: crypto.randomUUID(), type: 'item', itemId: pricedItems[0].id, quantity: 1, unit: pricedItems[0].unit, yieldPercentage: 100 };
        setEditedRecipe({ ...editedRecipe, ingredients: [...editedRecipe.ingredients, newIngredient] });
    };

    const handleRemoveIngredientFromRecipe = (ingIndex: number) => {
        if (!editedRecipe) return;
        const updatedIngredients = editedRecipe.ingredients.filter((_, index) => index !== ingIndex);
        setEditedRecipe({ ...editedRecipe, ingredients: updatedIngredients });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !editedRecipe) return;
        
        const file = e.target.files[0];
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            addNotification("File is too large. Please select an image under 5MB.", 'error');
            return;
        }
        if (!file.type.startsWith('image/')) {
            addNotification("Please select a valid image file.", 'error');
            return;
        }

        setIsUploading(true);
        try {
            await uploadRecipeImage(editedRecipe.id, file);
            addNotification("Image uploaded successfully", 'success');
            // The useEffect hook will sync the new image URL from the context
        } catch (error) {
            console.error(error);
            addNotification("An error occurred during upload.", 'error');
        } finally {
            setIsUploading(false);
        }
    };
    
    const handleImageRemove = async () => {
        if (!editedRecipe || !editedRecipe.imageUrl) return;
        if (window.confirm("Are you sure you want to remove this image?")) {
            setIsUploading(true); // Re-use for loading state
            try {
                await removeRecipeImage(editedRecipe.id);
                setEditedRecipe(prev => prev ? { ...prev, imageUrl: undefined } : null);
                addNotification("Image removed", 'success');
            } catch (error) {
                console.error(error);
                addNotification("An error occurred while removing the image.", 'error');
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleExport = () => {
        const headers = ['recipeName', 'category', 'servings', 'instructions', 'targetSalePricePerServing', 'ingredientName', 'ingredientQuantity', 'ingredientUnit', 'yieldPercentage'];
        
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
                    yieldPercentage: '',
                });
            } else {
                recipe.ingredients.forEach(ing => {
                    const item = ing.type === 'item' ? getPricedItemById(ing.itemId) : getRecipeById(ing.itemId);
                    const itemName = item ? item.name : 'N/A';
                    dataToExport.push({
                        recipeName: recipe.name,
                        category: recipe.category,
                        servings: recipe.servings,
                        instructions: recipe.instructions.join('|'),
                        targetSalePricePerServing: recipe.targetSalePricePerServing || 0,
                        ingredientName: ing.type === 'recipe' ? `(Sub-Recipe) ${itemName}` : itemName,
                        ingredientQuantity: ing.quantity,
                        ingredientUnit: ing.unit,
                        yieldPercentage: ing.yieldPercentage || 100,
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
        labourCostMethod: 'blended',
        packagingCostPerServing: number,
        labourMinutes: number,
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

        const pricedItemNameMap = new Map(pricedItems.map(i => [i.name.toLowerCase(), i.id]));
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
                    labourCostMethod: 'blended',
                    packagingCostPerServing: 0,
                    labourMinutes: 0,
                });
            }

            const ingredientName = String(row.ingredientName || '');
            if (ingredientName) {
                const itemId = pricedItemNameMap.get(ingredientName.toLowerCase());
                if (itemId) {
                    const recipe = recipesMap.get(recipeName.toLowerCase());
                    if (recipe) {
                         recipe.ingredients.push({
                            id: crypto.randomUUID(),
                            type: 'item',
                            itemId: itemId,
                            quantity: parseFloat(row.ingredientQuantity) || 0,
                            unit: row.ingredientUnit,
                            yieldPercentage: parseFloat(row.yieldPercentage) || 100,
                        });
                    }
                } else {
                    errors.push(`Row ${index + 2}: Ingredient "${ingredientName}" not found in price list.`);
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
            labourMinutes: 0,
            packagingCostPerServing: 0,
            labourCostMethod: 'blended' as const,
        }));
        
        return { data, errors };
    };

    const handleImport = (data: Omit<Recipe, 'id' | 'businessId'>[]) => {
        return bulkAddRecipes(data);
    };

    const handleDownloadCostingSheet = () => {
        if (!editedRecipe) return;

        const business = businesses.find(b => b.id === activeBusinessId);
        const { rawMaterialCost } = calculateRecipeCostBreakdown(editedRecipe);
        
        const ingredientsWithDetails = editedRecipe.ingredients.map(ing => {
            let item, name;
            if (ing.type === 'item') {
                item = getPricedItemById(ing.itemId);
                name = item?.name || 'Unknown Item';
            } else {
                item = getRecipeById(ing.itemId);
                name = item?.name ? `(Sub-Recipe) ${item.name}` : 'Unknown Sub-Recipe';
            }
            
            // Create a temporary recipe with just this one ingredient to calculate its specific cost
            const tempRecipe: Recipe = { ...editedRecipe, ingredients: [ing] };
            const { rawMaterialCost: ingredientRMC } = calculateRecipeCostBreakdown(tempRecipe);
            
            const percentage = rawMaterialCost > 0 ? (ingredientRMC / rawMaterialCost) * 100 : 0;
            
            return {
                name,
                quantity: ing.quantity,
                unit: ing.unit,
                cost: ingredientRMC,
                percentage,
                prepYield: ing.yieldPercentage || 100,
                type: ing.type,
            };
        });

        const dataUrl = generateCostingSheetSVG({
            recipe: editedRecipe,
            ingredientsWithDetails,
            business,
            formatCurrency,
            calculateRecipeCost: (r) => calculateRecipeCostBreakdown(r).rawMaterialCost,
        });
        
        const printWindow = window.open('', '_blank');
        printWindow?.document.write(`<html><head><title>Print Costing Sheet</title><style>body{margin:0;}@page{size:auto;margin:0;}</style></head><body><img src="${dataUrl}" style="width:100%;"></body></html>`);
        printWindow?.document.close();
        setTimeout(() => {
            printWindow?.focus();
            printWindow?.print();
            printWindow?.close();
        }, 250);
        
        addNotification('Costing sheet is ready to print/save as PDF!', 'success');
    };

    const handleDetailChange = (field: keyof Recipe, value: string | number | boolean | undefined) => {
        if (!editedRecipe) return;
        setEditedRecipe({
            ...editedRecipe,
            [field]: value
        });
    };
    
    const handleIngredientDragSort = () => {
        if (!editedRecipe || dragItem.current === null || dragOverItem.current === null) return;
        const newIngredients = [...editedRecipe.ingredients];
        const draggedItemContent = newIngredients.splice(dragItem.current, 1)[0];
        newIngredients.splice(dragOverItem.current, 0, draggedItemContent);
        dragItem.current = null;
        dragOverItem.current = null;
        setEditedRecipe({ ...editedRecipe, ingredients: newIngredients });
        setDraggedIndex(null);
    };

    const costBreakdown = useMemo(() => editedRecipe ? calculateRecipeCostBreakdown(editedRecipe) : null, [editedRecipe, calculateRecipeCostBreakdown]);
    const foodCostPercentage = (costBreakdown && editedRecipe?.targetSalePricePerServing && editedRecipe.targetSalePricePerServing > 0) ? (costBreakdown.costPerServing / editedRecipe.targetSalePricePerServing) * 100 : 0;
    const potentialProfit = (editedRecipe?.targetSalePricePerServing || 0) - (costBreakdown?.costPerServing || 0);
    
    return (
        <>
        <RecipeFormModal 
            isOpen={isNewRecipeModalOpen} 
            onClose={() => setIsNewRecipeModalOpen(false)} 
            onSave={addRecipe} 
            categories={categories} 
            templates={recipeTemplates}
        />
        <ImportModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            title="Import Recipes"
            templateUrl="data:text/csv;charset=utf-8,recipeName,category,servings,instructions,targetSalePricePerServing,ingredientName,ingredientQuantity,ingredientUnit,yieldPercentage%0ASoup,Appetizers,4,Step%201%7CStep%202,10,Carrot,1,kg,95%0ASoup,Appetizers,4,Step%201%7CStep%202,10,Onion,2,unit,90"
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

        {editedRecipe && <>
            <ConfirmationModal
                isOpen={modalState.type === 'delete'}
                onClose={() => { setModalState({ type: null }); setDeleteError(null); }}
                onConfirm={handleConfirmDelete}
                title="Delete Recipe"
                message={deleteError ? <span className="text-red-700">{deleteError}</span> : `Are you sure you want to permanently delete "${editedRecipe.name}"? This action cannot be undone.`}
                confirmText={deleteError ? 'OK' : 'Delete'}
                confirmButtonClass={deleteError ? 'ican-btn ican-btn-primary' : 'ican-btn ican-btn-danger'}
                cancelText={deleteError ? '' : 'Cancel'}
            />
            <Modal isOpen={modalState.type === 'duplicate'} onClose={() => setModalState({ type: null })} title="Duplicate Recipe">
                <div>
                    <p className="mb-4">Do you want to include the cost history in the new duplicated recipe?</p>
                    <div className="flex flex-col-reverse md:flex-row md:justify-end md:space-x-2 gap-2">
                        <button onClick={() => { handleConfirmDuplicate(false); setModalState({ type: null }); }} className="ican-btn ican-btn-secondary w-full md:w-auto">No, Start Fresh</button>
                        <button onClick={() => { handleConfirmDuplicate(true); setModalState({ type: null }); }} className="ican-btn ican-btn-primary w-full md:w-auto">Yes, Include History</button>
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
                    <input type="text" name="templateName" id="templateName" defaultValue={`${editedRecipe.name} Base`} className="ican-input mt-1" required />
                    <div className="flex flex-col-reverse md:flex-row md:justify-end md:space-x-2 pt-4 mt-2 gap-2">
                        <button type="button" onClick={() => setModalState({ type: null })} className="ican-btn ican-btn-secondary w-full md:w-auto">Cancel</button>
                        <button type="submit" className="ican-btn ican-btn-primary w-full md:w-auto">Save Template</button>
                    </div>
                </form>
            </Modal>
        </>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`${editedRecipe ? 'hidden lg:block' : 'block'} lg:col-span-1`}>
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Recipes</h2>
                        <div className="flex items-center space-x-1">
                            <ActionsDropdown onExport={handleExport} onImport={() => setIsImportModalOpen(true)} />
                            <button onClick={() => { setIsNewRecipeModalOpen(true); }} className="flex items-center text-[var(--color-primary)] hover:opacity-80 p-2 rounded-lg" title="New Recipe">
                                <PlusCircle size={22} />
                            </button>
                        </div>
                    </div>
                     <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full md:max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={18} />
                            <input
                                type="text"
                                placeholder="Search recipes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="ican-input pl-10"
                            />
                        </div>
                         <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="ican-select w-full md:w-48"
                        >
                            <option value="all">All Categories</option>
                            {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-2">
                         {filteredRecipes.length > 0 ? filteredRecipes.map(recipe => (
                            <div
                                key={recipe.id}
                                onClick={() => handleSelectRecipe(recipe)}
                                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                                    selectedRecipe?.id === recipe.id
                                        ? 'bg-[var(--color-primary-light)] border-[var(--color-primary)] shadow-sm'
                                        : 'bg-[var(--color-input)] border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className={`font-semibold ${selectedRecipe?.id === recipe.id ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-primary)]'}`}>{recipe.name}</h3>
                                        <p className="text-xs text-[var(--color-text-muted)]">{recipe.category}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-2">
                                        <p className="font-bold text-sm">{formatCurrency(calculateRecipeCostBreakdown(recipe).costPerServing)}</p>
                                        <p className="text-xs text-[var(--color-text-muted)]">/ serving</p>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-10 text-[var(--color-text-muted)]">
                                <p>No recipes found.</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            <div className={`lg:col-span-2 ${!editedRecipe ? 'hidden lg:block' : 'block'}`}>
            {editedRecipe && costBreakdown ? (
            <div className="space-y-6">
                 {/* Header */}
                 <Card noPadding>
                    <div className="flex flex-col md:flex-row justify-between md:items-center p-4">
                        <div className="flex items-center mb-4 md:mb-0">
                             <button className="lg:hidden mr-4 text-[var(--color-text-muted)]" onClick={() => setEditedRecipe(null)} aria-label="Back to list">
                                <ChevronLeft size={24} />
                             </button>
                             <div className="relative group w-16 h-16 mr-4 flex-shrink-0">
                                {isUploading ? (
                                    <div className="w-full h-full bg-[var(--color-input)] rounded-lg flex items-center justify-center"><Loader2 size={24} className="animate-spin text-[var(--color-primary)]"/></div>
                                ) : editedRecipe.imageUrl ? (
                                    <>
                                        <img src={editedRecipe.imageUrl} alt={editedRecipe.name} className="w-16 h-16 object-cover rounded-lg" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                                             <button onClick={handleImageRemove} className="text-white hover:text-[var(--color-danger)] p-1 rounded-full bg-black/30"><Trash2 size={18} /></button>
                                        </div>
                                    </>
                                ) : (
                                    <label htmlFor="image-upload" className="w-16 h-16 bg-[var(--color-input)] border-2 border-dashed border-[var(--color-border)] rounded-lg flex items-center justify-center cursor-pointer hover:border-[var(--color-primary)]">
                                        <UploadCloud size={24} className="text-[var(--color-text-muted)]"/>
                                    </label>
                                )}
                                <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            </div>
                            <div>
                                <input 
                                    type="text"
                                    value={editedRecipe.name}
                                    onChange={(e) => handleDetailChange('name', e.target.value)}
                                    className="text-2xl font-bold bg-transparent border-none p-0 focus:ring-0 w-full text-[var(--color-text-primary)]"
                                />
                                <input 
                                    type="text"
                                    value={editedRecipe.category}
                                    onChange={(e) => handleDetailChange('category', e.target.value)}
                                    className="text-sm bg-transparent border-none p-0 focus:ring-0 w-full text-[var(--color-text-muted)]"
                                    list="recipe-categories-edit"
                                />
                                <datalist id="recipe-categories-edit">
                                    {categories.map((cat) => <option key={cat.id} value={cat.name} />)}
                                </datalist>
                            </div>
                        </div>
                        <div className="flex items-center space-x-1 flex-shrink-0 self-end md:self-center">
                           {isDirty && (
                           <>
                                <button onClick={handleCancelChanges} title="Cancel changes" className="ican-btn ican-btn-secondary p-2"><XCircle size={20} /></button>
                                <button onClick={handleSaveChanges} title="Save changes" className="ican-btn ican-btn-primary p-2"><Save size={20} /></button>
                           </>
                           )}
                           <div className="border-l border-[var(--color-border)] h-8 mx-2"></div>
                           <button onClick={() => setModalState({ type: 'duplicate' })} title="Duplicate" className="ican-btn ican-btn-secondary p-2"><Copy size={18} /></button>
                           <button onClick={() => setModalState({ type: 'saveTemplate' })} title="Save as Template" className="ican-btn ican-btn-secondary p-2"><FileText size={18} /></button>
                           <button onClick={() => setModalState({ type: 'delete' })} title="Delete" className="ican-btn ican-btn-danger p-2"><Trash2 size={18} /></button>
                        </div>
                    </div>
                 </Card>

                {/* TABS */}
                <div className="border-b border-[var(--color-border)] bg-[var(--color-card)] rounded-t-lg sticky top-[81px] z-10">
                    <nav className="-mb-px flex space-x-4 px-4" aria-label="Tabs">
                        <TabButton label="Overview" icon={<PieChart size={16} />} isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                        <TabButton label="Ingredients" icon={<ClipboardList size={16} />} isActive={activeTab === 'ingredients'} onClick={() => setActiveTab('ingredients')} />
                        <TabButton label="Instructions" icon={<ListChecks size={16} />} isActive={activeTab === 'instructions'} onClick={() => setActiveTab('instructions')} />
                        <TabButton label="Configuration" icon={<SlidersHorizontal size={16} />} isActive={activeTab === 'configuration'} onClick={() => setActiveTab('configuration')} />
                    </nav>
                </div>
                
                {/* TAB CONTENT */}
                <div className="mt-0">
                    {activeTab === 'overview' && (
                        <div className="space-y-6" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                            <Card>
                                <h3 className="text-lg font-bold mb-4">Total True Cost Breakdown</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                                    <div className="bg-[var(--color-input)] p-3 rounded-lg">
                                        <p className="text-xs text-[var(--color-text-muted)]">Raw Materials</p>
                                        <p className="font-bold text-lg">{formatCurrency(costBreakdown.rawMaterialCost)}</p>
                                    </div>
                                    <div className="bg-[var(--color-input)] p-3 rounded-lg">
                                        <p className="text-xs text-[var(--color-text-muted)]">Direct Labour</p>
                                        <p className="font-bold text-lg">{formatCurrency(costBreakdown.labourCost)}</p>
                                    </div>
                                    <div className="bg-[var(--color-input)] p-3 rounded-lg">
                                        <p className="text-xs text-[var(--color-text-muted)]">Overheads (V+F)</p>
                                        <p className="font-bold text-lg">{formatCurrency(costBreakdown.variableOverheadCost + costBreakdown.fixedOverheadCost)}</p>
                                    </div>
                                    <div className="bg-[var(--color-input)] p-3 rounded-lg">
                                        <p className="text-xs text-[var(--color-text-muted)]">Packaging</p>
                                        <p className="font-bold text-lg">{formatCurrency(costBreakdown.packagingCost)}</p>
                                    </div>
                                    <div className="bg-[var(--color-primary-light)] p-3 rounded-lg col-span-2 md:col-span-1">
                                        <p className="text-xs text-[var(--color-primary)]/80">Total Cost</p>
                                        <p className="font-bold text-lg text-[var(--color-primary)]">{formatCurrency(costBreakdown.totalCost)}</p>
                                    </div>
                                    <div className="bg-[var(--color-primary-light)] p-3 rounded-lg">
                                        <p className="text-xs text-[var(--color-primary)]/80">Cost / Serving</p>
                                        <p className="font-bold text-lg text-[var(--color-primary)]">{formatCurrency(costBreakdown.costPerServing)}</p>
                                    </div>
                                </div>
                            </Card>
                             <Card>
                                 <h3 className="text-lg font-bold mb-4">Profitability Analysis</h3>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">Target Sale Price</label>
                                        <input type="number" min="0" step="0.01" value={editedRecipe.targetSalePricePerServing} onChange={(e) => handleDetailChange('targetSalePricePerServing', Number(e.target.value))} className="ican-input w-full" />
                                    </div>
                                    <div className="bg-[var(--color-input)] p-4 rounded-lg space-y-3">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-[var(--color-text-muted)]">Cost / Serving:</span>
                                            <span className="font-semibold">{formatCurrency(costBreakdown.costPerServing)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-[var(--color-text-muted)]">Food Cost %:</span>
                                            <span className={`font-bold ${foodCostPercentage > (settings.foodCostTarget + 5) ? 'text-[var(--color-danger)]' : foodCostPercentage > settings.foodCostTarget ? 'text-[var(--color-warning)]' : 'text-[var(--color-success)]'}`}>{foodCostPercentage.toFixed(1)}%</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm pt-2 border-t border-[var(--color-border)]">
                                            <span className="font-semibold text-md text-[var(--color-text-primary)]">Potential Profit:</span>
                                            <span className={`font-bold text-lg ${potentialProfit >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>{formatCurrency(potentialProfit)}</span>
                                        </div>
                                    </div>
                                 </div>
                            </Card>
                            <Card>
                                <div className="flex justify-between items-center mb-4">
                                     <h3 className="text-lg font-bold flex items-center"><TrendingUp size={20} className="mr-2 text-[var(--color-primary)]"/> Cost History</h3>
                                     <div className="flex items-center space-x-2">
                                       <button onClick={handleDownloadCostingSheet} className="ican-btn ican-btn-secondary text-sm p-2"><Download size={16} /></button>
                                       <button onClick={() => setIsHistoryVisible(!isHistoryVisible)} className="ican-btn ican-btn-secondary p-2">{isHistoryVisible ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}</button>
                                     </div>
                                </div>
                                 {isHistoryVisible && (
                                    <ResponsiveContainer width="100%" height={200}>
                                        <LineChart data={editedRecipe.costHistory}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                            <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString()} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}/>
                                            <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                                            <Tooltip
                                              formatter={(value: number) => formatCurrency(value)}
                                              contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', color: 'var(--color-text-primary)', boxShadow: 'var(--shadow-md)' }}
                                            />
                                            <Line type="monotone" dataKey="cost" stroke="var(--color-primary)" strokeWidth={2} name="Total Cost" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                 )}
                            </Card>
                        </div>
                    )}
                    {activeTab === 'ingredients' && (
                        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                            <Card>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold">Ingredients</h3>
                                    <button onClick={handleAddIngredientToRecipe} className="ican-btn ican-btn-secondary py-1 px-3 text-sm" disabled={pricedItems.length === 0}><PlusCircle size={16} className="mr-1.5"/>Add Ingredient</button>
                                </div>
                                 <div className="space-y-3">
                                    {editedRecipe.ingredients.map((ing, index) => {
                                        const tempRecipe: Recipe = { ...editedRecipe, ingredients: [ing] };
                                        const { rawMaterialCost: lineCost } = calculateRecipeCostBreakdown(tempRecipe);
                                        
                                        return (
                                            <div 
                                                key={ing.id} 
                                                draggable
                                                onDragStart={() => dragItem.current = index}
                                                onDragEnter={() => dragOverItem.current = index}
                                                onDragEnd={handleIngredientDragSort}
                                                onDragOver={e => e.preventDefault()}
                                                className="p-3 rounded-lg bg-[var(--color-input)] border border-[var(--color-border)] group"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-start flex-grow pr-4">
                                                         <GripVertical size={20} className="cursor-grab text-[var(--color-text-muted)] mr-2 mt-2 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                                                        <select value={`${ing.type}::${ing.itemId}`} onChange={e => handleIngredientChange(index, 'itemId', e.target.value)} className="ican-select w-full font-semibold">
                                                            <optgroup label="Priced Items">
                                                                {pricedItems.map(item => <option key={item.id} value={`item::${item.id}`}>{item.name}</option>)}
                                                            </optgroup>
                                                            <optgroup label="Sub-Recipes">
                                                                {subRecipes.map(item => <option key={item.id} value={`recipe::${item.id}`}>{item.name}</option>)}
                                                            </optgroup>
                                                        </select>
                                                    </div>
                                                    <button onClick={() => handleRemoveIngredientFromRecipe(index)} className="text-[var(--color-danger)]/80 hover:text-[var(--color-danger)] flex-shrink-0 p-1"><X size={18} /></button>
                                                </div>
                                                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm pl-8">
                                                    <div>
                                                        <label className="block text-xs font-medium text-[var(--color-text-muted)]">Quantity</label>
                                                        <div className="flex items-center">
                                                            <input type="number" value={ing.quantity} onChange={e => handleIngredientChange(index, 'quantity', parseFloat(e.target.value) || 0)} className="ican-input mt-1 p-1.5 w-full" placeholder="Qty"/>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-[var(--color-text-muted)]">Unit</label>
                                                        <select value={ing.unit} onChange={e => handleIngredientChange(index, 'unit', e.target.value)} className="ican-select mt-1 p-1.5 w-full">
                                                            {allUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-[var(--color-text-muted)]">Prep Yield %</label>
                                                        <input type="number" value={ing.yieldPercentage || 100} onChange={e => handleIngredientChange(index, 'yieldPercentage', parseFloat(e.target.value) || 0)} className="ican-input mt-1 p-1.5" placeholder="Yield %"/>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-[var(--color-text-muted)]">Line Cost</label>
                                                        <p className="font-bold text-[var(--color-primary)] p-1.5 mt-1">{formatCurrency(lineCost)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                             </Card>
                        </div>
                    )}
                    {activeTab === 'instructions' && (
                        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                             <Card>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold">Instructions</h3>
                                    <button onClick={handleAddInstruction} className="ican-btn ican-btn-secondary py-1 px-3 text-sm"><PlusCircle size={16} className="mr-1.5"/>Add Step</button>
                                </div>
                                 <ol className="space-y-3">
                                    {editedRecipe.instructions.map((inst, index) => (
                                      <li key={index}
                                          draggable
                                          onDragStart={() => dragItem.current = index}
                                          onDragEnter={(e) => { e.preventDefault(); dragOverItem.current = index; setDraggedIndex(index); }}
                                          onDragEnd={handleDragSort}
                                          onDragOver={e => e.preventDefault()}
                                          className={`flex items-start group transition-all p-2 rounded-lg ${draggedIndex === index ? 'bg-[var(--color-input)]' : ''}`}>
                                         <span className="text-sm font-semibold text-[var(--color-text-muted)] mr-3 pt-1">{index + 1}.</span>
                                         <textarea 
                                            value={inst} 
                                            onChange={(e) => handleInstructionChange(index, e.target.value)}
                                            rows={Math.max(1, Math.ceil(inst.length / 50))} // Auto-resize
                                            className="w-full text-sm bg-transparent focus:outline-none focus:ring-0 resize-none leading-relaxed p-1 rounded-md focus:bg-[var(--color-input)]"/>
                                         <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                            <button onClick={() => handleRemoveInstruction(index)} className="text-[var(--color-danger)]/80 hover:text-[var(--color-danger)] p-1"><Trash2 size={16}/></button>
                                            <GripVertical size={16} className="cursor-grab text-[var(--color-text-muted)]"/>
                                         </div>
                                      </li>
                                    ))}
                                 </ol>
                             </Card>
                        </div>
                    )}
                    {activeTab === 'configuration' && (
                        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                            <Card>
                                <h3 className="text-lg font-bold mb-4">Recipe Configuration</h3>
                                <div className="space-y-6 text-sm">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-[var(--color-text-muted)]">Servings</label>
                                            <input type="number" min="1" value={editedRecipe.servings} onChange={(e) => handleDetailChange('servings', Number(e.target.value))} className="ican-input mt-1 p-2 h-auto" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-[var(--color-text-muted)]">Labour (mins/serving)</label>
                                            <input type="number" min="0" step="0.5" value={editedRecipe.labourMinutes} onChange={(e) => handleDetailChange('labourMinutes', Number(e.target.value))} className="ican-input mt-1 p-2 h-auto" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-[var(--color-text-muted)]">Packaging (/serving)</label>
                                            <input type="number" min="0" step="0.01" value={editedRecipe.packagingCostPerServing} onChange={(e) => handleDetailChange('packagingCostPerServing', Number(e.target.value))} className="ican-input mt-1 p-2 h-auto" />
                                        </div>
                                    </div>
                                     <div className="pt-4 border-t border-[var(--color-border)]">
                                        <h5 className="font-medium text-[var(--color-text-secondary)] mb-2 flex items-center">
                                            Sub-Recipe Production
                                            <span className="group relative ml-1.5">
                                                <Info size={14} className="cursor-help text-[var(--color-text-muted)]" />
                                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                    If you plan to use this recipe as an ingredient in other recipes, define its output here. E.g., a batch of sauce might yield 5 Liters.
                                                </span>
                                            </span>
                                        </h5>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-[var(--color-text-muted)]">Production Yield</label>
                                                <input type="number" min="0" value={editedRecipe.productionYield || ''} onChange={(e) => handleDetailChange('productionYield', Number(e.target.value) || undefined)} className="ican-input mt-1 p-2 h-auto" placeholder="e.g., 5" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-[var(--color-text-muted)]">Production Unit</label>
                                                <input type="text" value={editedRecipe.productionUnit || ''} onChange={(e) => handleDetailChange('productionUnit', e.target.value)} className="ican-input mt-1 p-2 h-auto" placeholder="e.g., kg, L" />
                                            </div>
                                        </div>
                                    </div>
                                     <div className="pt-4 border-t border-[var(--color-border)]">
                                        <label className="block font-medium text-[var(--color-text-secondary)] mb-2">Labour Cost Method</label>
                                        <select
                                            value={editedRecipe.labourCostMethod || 'blended'}
                                            onChange={(e) => {
                                                const method = e.target.value as Recipe['labourCostMethod'];
                                                const newRecipe = { ...editedRecipe, labourCostMethod: method };
                                                if (method !== 'staff') newRecipe.assignedStaffId = undefined;
                                                if (method !== 'custom') {
                                                    newRecipe.customLabourSalary = undefined;
                                                    newRecipe.customWorkingDays = undefined;
                                                    newRecipe.customWorkingHours = undefined;
                                                }
                                                setEditedRecipe(newRecipe);
                                            }}
                                            className="ican-select w-full"
                                        >
                                            <option value="blended">Blended Rate (Business Average)</option>
                                            <option value="staff">Specific Staff Member</option>
                                            <option value="custom">Custom Values</option>
                                        </select>
                                        
                                        {editedRecipe.labourCostMethod === 'staff' && (
                                            <div className="mt-4" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                                                 <label className="block text-xs font-medium text-[var(--color-text-muted)]">Select Staff</label>
                                                 <select 
                                                    value={editedRecipe.assignedStaffId || ''} 
                                                    onChange={(e) => handleDetailChange('assignedStaffId', e.target.value)}
                                                    className="ican-select w-full mt-1"
                                                >
                                                    <option value="" disabled>Choose a staff member...</option>
                                                    {staffMembers.map(staff => (
                                                        <option key={staff.id} value={staff.id}>{staff.name}</option>
                                                    ))}
                                                 </select>
                                            </div>
                                        )}
                                        
                                        {editedRecipe.labourCostMethod === 'custom' && (
                                            <div className="mt-4 space-y-3 bg-[var(--color-input)] p-3 rounded-lg" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                                                <p className="text-xs text-[var(--color-text-muted)]">Override global financial settings for this recipe's labour calculation.</p>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-medium text-[var(--color-text-muted)]">Monthly Salary</label>
                                                        <input
                                                            type="number"
                                                            value={editedRecipe.customLabourSalary || ''}
                                                            onChange={(e) => handleDetailChange('customLabourSalary', Number(e.target.value))}
                                                            className="ican-input mt-1 p-2 h-auto"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-[var(--color-text-muted)]">Working Days</label>
                                                        <input
                                                            type="number"
                                                            value={editedRecipe.customWorkingDays || ''}
                                                            onChange={(e) => handleDetailChange('customWorkingDays', Number(e.target.value))}
                                                            className="ican-input mt-1 p-2 h-auto"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-[var(--color-text-muted)]">Hours / Day</label>
                                                        <input
                                                            type="number"
                                                            value={editedRecipe.customWorkingHours || ''}
                                                            onChange={(e) => handleDetailChange('customWorkingHours', Number(e.target.value))}
                                                            className="ican-input mt-1 p-2 h-auto"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
            ) : (
                <Card className="flex flex-col items-center justify-center text-center h-[calc(100vh-120px)]">
                     <ListChecks size={64} className="text-[var(--color-border)] mb-4"/>
                     <h2 className="text-xl font-bold">Select a Recipe</h2>
                     <p className="text-[var(--color-text-muted)] mt-2 max-w-xs">Choose a recipe from the list to view its details, manage ingredients, and analyze costs.</p>
                     <button onClick={() => setIsNewRecipeModalOpen(true)} className="mt-6 ican-btn ican-btn-primary">
                        Create Your First Recipe
                    </button>
                </Card>
            )}
            </div>
        </div>
        </>
    );
};

export default Recipes;
