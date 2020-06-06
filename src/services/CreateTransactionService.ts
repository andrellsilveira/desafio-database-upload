import { getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CategoriesRepository from '../repositories/CategoriesRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  categoryTitle: string;
}

class CreateTransactionService {
  public async execute(data: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getCustomRepository(CategoriesRepository);

    /** Verifica se a categoria já existe */
    const findCategory = await categoriesRepository.findCategory(
      data.categoryTitle,
    );

    let category_id;

    if (!findCategory) {
      const category = categoriesRepository.create({
        title: data.categoryTitle,
      });

      await categoriesRepository.save(category);

      category_id = category.id;
    } else {
      category_id = findCategory.id;
    }

    if (data.type === 'outcome') {
      const extrapolateIncome = await transactionsRepository.verifyExtrapolateIncome(
        data.value,
      );

      if (extrapolateIncome) {
        throw new AppError(
          'The value informed extrapolate the total income.',
          400,
        );
      }
    }

    const transaction = transactionsRepository.create({
      title: data.title,
      value: data.value,
      type: data.type,
      category_id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
