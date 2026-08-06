import { render, screen } from '@testing-library/react-native';

import HomeScreen from '@/app/index';

describe('<HomeScreen />', () => {
  it('presents the SiteProof foundation state', async () => {
    await render(<HomeScreen />);

    expect(screen.getByRole('header', { name: 'SiteProof' })).toBeVisible();
    expect(screen.getByText('Foundation ready')).toBeVisible();
    expect(screen.getByText('Offline-ready mobile inspection workflow')).toBeVisible();
  });

  it('labels future device workflows as planned', async () => {
    await render(<HomeScreen />);

    expect(screen.getByText('Camera evidence')).toBeVisible();
    expect(screen.getByText('Location verification')).toBeVisible();
    expect(screen.getByText('Offline records')).toBeVisible();
    expect(screen.getByText('Lifecycle-aware synchronization')).toBeVisible();
    expect(screen.getAllByText('Planned')).toHaveLength(4);
  });
});
