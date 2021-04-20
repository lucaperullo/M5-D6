import fs from "fs-extra";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const currentWorkingFile = fileURLToPath(import.meta.url);
const currentWorkingDirectory = dirname(currentWorkingFile);
const booksPath = join(currentWorkingDirectory, "./services/books/books.json");

const readDB = async (filePath) => {
  try {
    const fileJson = await fs.readJSON(filePath);
    return fileJson;
  } catch (error) {
    throw new Error(error);
  }
};

const writeDB = async (filePath, fileContent) => {
  try {
    await fs.writeJSON(filePath, fileContent);
  } catch (error) {
    throw new Error(error);
  }
};

export const getBooks = async () => readDB(booksPath);
export const writeBooks = async (booksData) => writeDB(booksPath, booksData);
