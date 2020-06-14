import { getRepository } from 'typeorm';

import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    const transactionsRepository = getRepository(Transaction); // TODO

    // * Verifica se existe a transação
    const existsTransaction = await transactionsRepository.findOne({
      where: { id },
    });

    if (!existsTransaction) {
      throw new AppError(
        'Not exists a transaction with this information.',
        400,
      );
    }

    await transactionsRepository.delete(id);
  }
}

export default DeleteTransactionService;
