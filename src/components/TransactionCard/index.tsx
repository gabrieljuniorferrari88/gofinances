import React from 'react';
import { categories } from '../../utils/categories';

import {
  Container,
  Title,
  Amount,
  Footer,
  Category,
  Icon,
  CategoryName,
  Date,
	SubHeader,
	TrashButton,
	TrashIcon
} from './styles';

export interface TransactionCardProps {	
  type: 'positive' | 'negative';
  name: string;
  amount: string;
  category: string;
  date: string;
	id: string;
}
interface Props {
  data: TransactionCardProps;
	// teste: (id: string)=>{};
	teste(id: string, name: string, amount: string): Promise<void>;
}

export function TransactionCard({ data, teste }: Props) {
  const [category] = categories.filter((item) => item.key === data.category);

  return (
    <Container>
      {/* <Title>{data.name}</Title> */}

			<SubHeader>
				<Title>{data.name}</Title>				
					<TrashButton onPress={() => {teste(data.id, data.name, data.amount)}}>
						<TrashIcon name={'trash'} />
					</TrashButton>
			</SubHeader>

      <Amount type={data.type}>
        {data.type === 'negative' && '- '}
        {data.amount}
      </Amount>

      <Footer>
        <Category>
          <Icon name={category.icon} />
          <CategoryName>{category.name}</CategoryName>
        </Category>

        <Date>{data.date}</Date>
      </Footer>
    </Container>
  );
}
