import DataUriParser from "datauri/parser.js"
import path from "path"


// this code appears to be a utility function that takes a file object, extracts the file extension, and uses a DataUriParser instance to format the file content into a data URI.The data URI can then be used, for example, to embed the file content directly into HTML or CSS.
const getDataUri = (file) => {
    const parser = new DataUriParser();
    const extName = path.extname(file.originalname).toString()
    return parser.format(extName, file.buffer);


};

export default getDataUri;