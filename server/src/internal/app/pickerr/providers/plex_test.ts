import { createProvider } from './plex';

const TEST_PLEX_URL = process.env.TEST_PLEX_URL;
const TEST_PLEX_TOKEN = process.env.TEST_PLEX_TOKEN;

describe('providers -> plex -> getFilters', () => {
  if (!TEST_PLEX_URL || !TEST_PLEX_TOKEN) {
    console.warn('TEST_PLEX_URL or TEST_PLEX_TOKEN not set. Skipping test.');
    return;
  }

  it('should fetch filters from Plex', async () => {
    const provider = createProvider('0', {
      url: TEST_PLEX_URL,
      token: TEST_PLEX_TOKEN,
      libraryTypeFilter: ['movie'],
    });

    const filters = await provider.getFilters();
    expect(filters).toBeTruthy();
  });
});
