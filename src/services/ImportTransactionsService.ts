import { getRepository, In } from 'typeorm';
import csvParse from 'csv-parse';
import fs from 'fs';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface TransactionCSV {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  categoryTitle: string;
}

class ImportTransactionsService {
  public async execute(filePath: string): Promise<Transaction[]> {
    const transactionsRepository = getRepository(Transaction);
    const categoriesRepository = getRepository(Category);

    const readCSVStream = fs.createReadStream(filePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const transactions: TransactionCSV[] = [];
    const categories: string[] = [];

    /* parseCSV.on('data', line => {
      lines.push(line);
    }); */

    parseCSV.on('data', async line => {
      const [title, type, value, categoryTitle] = line;

      if (!title || !type || !value) return;

      categories.push(categoryTitle);
      transactions.push({ title, type, value, categoryTitle });
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    // * Recupera as categorias importadas que já existem no banco de dados
    const existentCategories = await categoriesRepository.find({
      where: In(categories),
    });

    // * Recupera os títulos das categorias já existentes
    const existentCategoriesTitles = existentCategories.map(
      (category: Category) => category.title,
    );

    // * Recupera as categorias que não estão cadastradas para inseri-las
    const addCategoryTtiles = categories
      // * Filtra as categorias dentro do array que ainda não foram cadastradas no banco
      .filter(category => !existentCategoriesTitles.includes(category))
      // * Retira todos as informações duplicadas
      .filter((value, index, self) => self.indexOf(value) === index);

    // * Cria a nova categoria mapeando o array de categorias para adicionar
    const newCategories = categoriesRepository.create(
      addCategoryTtiles.map(title => ({
        title,
      })),
    );

    // * Grava as novas categorias
    await categoriesRepository.save(newCategories);

    // * Junta as novas categorias àquelas já existentes
    const finalCategories = [...newCategories, ...existentCategories];

    // * Realiza a criação das transações
    const createdTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.categoryTitle,
        ),
      })),
    );

    // * Grava as novas transações
    await transactionsRepository.save(createdTransactions);

    // * Exclui o arquivo CSV
    await fs.promises.unlink(filePath);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
