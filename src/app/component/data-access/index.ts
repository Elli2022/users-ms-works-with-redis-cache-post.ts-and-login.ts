// src/app/component/data-access/index.ts
import {
  insertOneDocument,
  findDocuments as makeFindDocuments,
  updateDocument as makeUpdateDocument,
} from "../../libs/mongodb";

export const insertDocument = async ({ document, dbConfig }) => {
  const { acknowledged, insertedId } = await insertOneDocument({
    document,
    ...dbConfig,
  });
  if (acknowledged) {
    // Om dokumentet sparades framgångsrikt, hämta det fullständiga användarobjektet
    const query = { _id: insertedId };
    const savedUser = await makeFindDocuments({ query, ...dbConfig });
    return savedUser[0]; // Antag att findDocuments returnerar en lista och vi vill ha första objektet
  } else {
    // Hantera situationen om användaren inte kunde sparas
    throw new Error("Användaren kunde inte skapas");
  }
};

const updateDocument = ({ query, values, dbConfig }) =>
  makeUpdateDocument({ query, values, ...dbConfig });

const findDocuments = ({ query, dbConfig }) =>
  makeFindDocuments({ query, ...dbConfig });

export { findDocuments, updateDocument };
