"use client"

import { Container, Text, Button, Group, Center } from '@mantine/core';
import classes from './WelcomeTo.module.css';
import { Welcome } from '../Welcome/Welcome';
import { useState } from 'react';

export function WelcomeTo() {
  
  return (
    <div className={classes.wrapper}>
        <Welcome />
        <Container size={700} className={classes.inner} ta="center">
        <Text className={classes.description} color="dimmed" pb={'xs'} >
          Deploy a new account and open a ZK session key
        </Text>
      </Container>
    </div>
  );
}