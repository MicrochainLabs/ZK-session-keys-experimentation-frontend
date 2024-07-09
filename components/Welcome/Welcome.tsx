import { Title, Text, Anchor } from '@mantine/core';
import classes from './Welcome.module.css';

export function Welcome() {
  return (
    <>
      <Title className={classes.title} ta="center" mt={100}>
        <Text component="span" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }} inherit>
        ZK Session key experimentation
          </Text>{' '}
      </Title>
    </>
  );
}
