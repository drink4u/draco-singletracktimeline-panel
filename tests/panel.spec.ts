import { test, expect } from '@grafana/plugin-e2e';

test('should display "No data" in case panel data is empty', async ({
  gotoPanelEditPage,
  readProvisionedDashboard,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
  const panelEditPage = await gotoPanelEditPage({ dashboard, id: '2' });
  await expect(panelEditPage.panel.locator).toContainText('No data');
});

test('should display timeline segments when data is passed to the panel', async ({
  panelEditPage,
  readProvisionedDataSource,
  page,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await panelEditPage.datasource.set(ds.name);
  await panelEditPage.setVisualization('Single Track Timeline');
  await expect(page.getByTestId('single-lane-timeline')).toBeVisible();
  await expect(page.getByTestId('timeline-segment')).toHaveCount(4);
});

test('should hide labels when "Show labels" option is disabled', async ({
  gotoPanelEditPage,
  readProvisionedDashboard,
  page,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
  const panelEditPage = await gotoPanelEditPage({ dashboard, id: '1' });
  const options = panelEditPage.getCustomOptions('Display');
  const showLabels = options.getSwitch('Show labels');

  await expect(panelEditPage.panel.locator).toContainText('running');
  await showLabels.uncheck({ force: true });
  await expect(panelEditPage.panel.locator).not.toContainText('running');
});
