import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from 'styled-components';
import { useAuth } from '../../hooks/auth';

import { HighLightCard } from '../../components/HighLightCard';
import {
  TransactionCard,
  TransactionCardProps,
} from '../../components/TransactionCard';

import {
  Container,
  Header,
  UserWrapper,
  UserInfo,
  Photo,
  User,
  UserGreeting,
  UserName,
  Icon,
  HighLightCards,
  Transactions,
  Title,
  TransactionList,
  LogoutButton,
  LoadContainer,
	SubHeader,
	TrashButton,
  TrashIcon
} from './styles';

export interface DataListProps extends TransactionCardProps {
  id: string;
}

interface HighLightProps {
  amount: string;
  lastTransaction: string;
}
interface HighLightData {
  entries: HighLightProps;
  expensives: HighLightProps;
  total: HighLightProps;
}

interface TransactionData {
	id: string;
  type: 'positive' | 'negative';
  name: string;
  amount: string;
  category: string;
  date: string;
}

export function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<DataListProps[]>([]);
  const [highLightData, setHighLightData] = useState<HighLightData>(
    {} as HighLightData
  );

  const theme = useTheme();
	const { signOut, user } = useAuth();

  function getLastTransactionDate(
    collection: DataListProps[],
    type: 'positive' | 'negative'
  ) {

		const collectionFiltered = collection.filter((transaction) => transaction.type === type);

		if(collectionFiltered.length === 0){
			return 0
		}

    const lastTransaction = new Date(
      Math.max.apply(
        Math, collectionFiltered        
          .map((transaction) => new Date(transaction.date).getTime())
      )
    );

    return `${lastTransaction.getDate()} de ${lastTransaction.toLocaleDateString(
      'pt-BR',
      { month: 'long' }
    )}`;
  }

  async function loadTransactions() {
    const dataKey = `@gofinances:transactions_user:${user.id}`;
    const response = await AsyncStorage.getItem(dataKey);
    const transactions = response ? JSON.parse(response) : [];

    let entriesTotal = 0;
    let expensiveTotal = 0;

    // ! Inicia a atualização das transações
    const transactionsFormatted: DataListProps[] = transactions.map(
      (item: DataListProps) => {
        if (item.type === 'positive') {
          entriesTotal += Number(item.amount);
        } else {
          expensiveTotal += Number(item.amount);
        }

        const amount = Number(item.amount).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        });

        const date = Intl.DateTimeFormat('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
        }).format(new Date(item.date));

        return {
          id: item.id,
          name: item.name,
          amount,
          type: item.type,
          category: item.category,
          date,
        };
      }
    );

    setTransactions(transactionsFormatted);

    // ! Fim atualiza as transações

    const lastTransactionEntries = getLastTransactionDate(
      transactions,
      'positive'
    );
    const lastTransactionExpensives = getLastTransactionDate(
      transactions,
      'negative'
    );

    const totalInterval = lastTransactionExpensives === 0 
		? 'Não há transações'
		: `01 á ${lastTransactionExpensives}`;

    const total = entriesTotal - expensiveTotal;		

    setHighLightData({
      entries: {
        amount: entriesTotal.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }),
        lastTransaction: lastTransactionEntries === 0
				? 'Não há transações'
				: `Última entrada dia ${lastTransactionEntries}`,
      },

      expensives: {
        amount: expensiveTotal.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }),
        lastTransaction: lastTransactionExpensives === 0 
				? 'Não há transações'
				: `Última saída dia ${lastTransactionExpensives}`,
      },
      total: {
        amount: total.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }),
        lastTransaction: totalInterval,
      },
    });

    setIsLoading(false);
  }

	async function deleteTransaction(id: string){		
		const dataKey = `@gofinances:transactions_user:${user.id}`;
    const response = await AsyncStorage.getItem(dataKey);
    const transactions: DataListProps[]= response ? JSON.parse(response) : [];

		const newTransaction = transactions.filter((transaction) => transaction.id !== id);
		await AsyncStorage.setItem(dataKey, JSON.stringify(newTransaction));
		loadTransactions().then((r) => {})
	}

	async function handleDeleteTransaction(id: string, name: string, amount: string) {
		return Alert.alert(
      'Excluir Transação',
      `Tem certeza que você deseja excluir ${name} no valor de ${amount}?`,
      [
        {
          style: 'cancel',
          text: 'Não'
        },
        {
          style: 'destructive',
          text: 'Sim',
          onPress: () => {
            deleteTransaction(id)
						loadTransactions().then((r) => {})
          }
        }
      ],
			{
				cancelable: true,
			}
    )
	}

	async function handleClearTransactions() {
    return Alert.alert(
      'Limpar lista',
      'Tem certeza que você deseja limpar todas as transações da lista?',
      [
        {
          style: 'cancel',
          text: 'Não'
        },
        {
          style: 'destructive',
          text: 'Sim',
          onPress: () => {
            AsyncStorage.removeItem(`@gofinances:transactions_user:${user.id}`)
            loadTransactions().then((r) => {})
          }
        }
      ],
			{
				cancelable: true,
			}
    )
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [])
  );

  return (
    <Container>
      {isLoading ? (
        <LoadContainer>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </LoadContainer>
      ) : (
        <>
          <Header>
            <UserWrapper>
              <UserInfo>
                <Photo
                  source={{
                    uri: user.photo,
                  }}
                />
                <User>
                  <UserGreeting>Olá, </UserGreeting>
                  <UserName>{ user.name }</UserName>
                </User>
              </UserInfo>

              <LogoutButton onPress={ signOut }>
                <Icon name="power" />
              </LogoutButton>
            </UserWrapper>
          </Header>

          <HighLightCards>
            <HighLightCard
              type="up"
              title="Entradas"
              amount={highLightData.entries.amount}
              lastTransaction={highLightData.entries.lastTransaction}
            />
            <HighLightCard
              type="down"
              title="Saídas"
              amount={highLightData.expensives.amount}
              lastTransaction={highLightData.expensives.lastTransaction}
            />
            <HighLightCard
              type="total"
              title="Total"
              amount={highLightData.total.amount}
              lastTransaction={highLightData.total.lastTransaction}
            />
          </HighLightCards>

          <Transactions>

					<SubHeader>
              <Title>Listagem</Title>
              {transactions.length > 0 && (
                <TrashButton onPress={handleClearTransactions}>
                  <TrashIcon name={'trash-2'} />
                </TrashButton>
              )}
            </SubHeader>

            <TransactionList
              data={transactions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <TransactionCard data={item} teste={handleDeleteTransaction}/>}
            />
          </Transactions>
        </>
      )}
    </Container>
  );
}