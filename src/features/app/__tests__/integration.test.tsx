import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AppHeader, CraftzBar } from '../mini-app-components';

describe('Integration Tests - MiniApp Components', () => {
  describe('AppHeader Component', () => {
    it('renders with basic props', () => {
      render(
        <AppHeader
          syncColor="#22c55e"
          syncLabel="Connected"
          isAdmin={false}
          myRank={42}
          myPoints={1000}
          username="testuser"
        />
      );

      expect(screen.getByText('CrafterZ')).toBeInTheDocument();
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('displays admin badge when isAdmin is true', () => {
      render(
        <AppHeader
          syncColor="#22c55e"
          syncLabel="Connected"
          isAdmin={true}
          myRank={1}
          myPoints={5000}
          username="admin"
        />
      );

      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('shows correct rank and points', () => {
      render(
        <AppHeader
          syncColor="#ef4444"
          syncLabel="Offline"
          isAdmin={false}
          myRank={99}
          myPoints={0}
          username="newuser"
        />
      );

      expect(screen.getByText('#99')).toBeInTheDocument();
      expect(screen.getByText('0 pts')).toBeInTheDocument();
    });
  });

  describe('CraftzBar Component', () => {
    it('renders with craftz information', () => {
      render(
        <CraftzBar
          craftz={75}
          craftzMax={100}
          craftzCost={10}
          craftzColor="#22c55e"
          craftzLow={false}
        />
      );

      expect(screen.getByText('⚡ Craftz')).toBeInTheDocument();
      expect(screen.getByText('75/100')).toBeInTheDocument();
    });

    it('shows warning when craftz is low', () => {
      render(
        <CraftzBar
          craftz={5}
          craftzMax={100}
          craftzCost={10}
          craftzColor="#ef4444"
          craftzLow={true}
        />
      );

      expect(screen.getByText('· need 10')).toBeInTheDocument();
    });

    it('displays craftz regeneration info', () => {
      render(
        <CraftzBar
          craftz={50}
          craftzMax={100}
          craftzCost={10}
          craftzColor="#eab308"
          craftzLow={false}
        />
      );

      expect(screen.getByText('+1 per 2.5s · costs 10 to craft')).toBeInTheDocument();
    });
  });
});
