// Extracted from curator.html - Undo/Redo Manager

export class UndoRedoManager {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
        this.maxStackSize = 50;
    }

    addAction(action) {
        // Add action to undo stack
        this.undoStack.push(action);

        // Clear redo stack when new action is performed
        this.redoStack = [];

        // Limit stack size
        if (this.undoStack.length > this.maxStackSize) {
            this.undoStack.shift();
        }

        this.updateButtons();
    }

    undo() {
        if (this.undoStack.length === 0) return false;

        const action = this.undoStack.pop();

        // Execute undo function
        if (action.undo && typeof action.undo === 'function') {
            action.undo();

            // Add to redo stack
            this.redoStack.push(action);
            this.updateButtons();

            console.log('Undid action:', action.description);
            return true;
        }

        return false;
    }

    redo() {
        if (this.redoStack.length === 0) return false;

        const action = this.redoStack.pop();

        // Execute redo function
        if (action.redo && typeof action.redo === 'function') {
            action.redo();

            // Add back to undo stack
            this.undoStack.push(action);
            this.updateButtons();

            console.log('Redid action:', action.description);
            return true;
        }

        return false;
    }

    canUndo() {
        return this.undoStack.length > 0;
    }

    canRedo() {
        return this.redoStack.length > 0;
    }

    updateButtons() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');

        if (undoBtn) {
            undoBtn.disabled = !this.canUndo();
            undoBtn.title = this.canUndo()
                ? `Undo: ${this.undoStack[this.undoStack.length - 1]?.description || 'last action'}`
                : 'Nothing to undo';
        }

        if (redoBtn) {
            redoBtn.disabled = !this.canRedo();
            redoBtn.title = this.canRedo()
                ? `Redo: ${this.redoStack[this.redoStack.length - 1]?.description || 'last undone action'}`
                : 'Nothing to redo';
        }
    }

    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.updateButtons();
    }
}
