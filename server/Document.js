import { model, Schema } from "mongoose";


const doc = new Schema({
    _id: String,
    data: Object,
})


export const Document = model("Document", doc)
