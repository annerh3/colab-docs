import { model, Schema } from "mongoose";

const documentSchema = new Schema({
    _id: String,
    title: {
        type: String,
        required: true,
        default: "Documento sin título"
    },
    data: {
        type: Object,
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Actualizar updatedAt antes de guardar
documentSchema.pre('findOneAndUpdate', function(next) {
    this.set({ updatedAt: Date.now() });
});

export const Document = model("Document", documentSchema);