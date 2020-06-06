import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

interface ObjectTransactionAndBalance {
  transactions: Transaction[];
  balance: Balance;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async all(): Promise<ObjectTransactionAndBalance> {
    const transactions = await this.find();
    const balance = await this.getBalance();

    const transactionsAndBalance: ObjectTransactionAndBalance = {
      transactions,
      balance,
    };

    return transactionsAndBalance;
  }

  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();

    let sunIncome = 0;
    let sunOutcome = 0;

    transactions.forEach(transaction => {
      if (transaction.type === 'income') {
        sunIncome += transaction.value;
      }
      if (transaction.type === 'outcome') {
        sunOutcome += transaction.value;
      }
    });

    const total = sunIncome - sunOutcome;

    const balance: Balance = {
      income: sunIncome,
      outcome: sunOutcome,
      total,
    };

    return balance;
  }

  public async verifyExtrapolateIncome(value: number): Promise<boolean> {
    const balance = await this.getBalance();

    if (value > balance.income) {
      return true;
    }

    return false;
  }
}

export default TransactionsRepository;
