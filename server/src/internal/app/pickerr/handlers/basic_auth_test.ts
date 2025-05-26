import { isAuthorized, respondRequiringAuth } from './basic_auth';

describe('basicAuth -> isAuthorized', () => {
  it('should return true for correct credentials', () => {
    const req = new Request('http://localhost', {
      headers: {
        Authorization: 'Basic Zm9vOmJhcg==', // foo:bar
      },
    });

    expect(isAuthorized({ userName: 'foo', password: 'bar' }, req)).toBe(true);
  });

  it('should return false for incorrect credentials', () => {
    const req = new Request('http://localhost', {
      headers: {
        Authorization: 'Basic Zm9vOmJhcg==', // foo:bar
      },
    });

    expect(isAuthorized({ userName: 'foo', password: 'baz' }, req)).toBe(false);
  });
});

describe('basicAuth -> respondRequiringAuth', () => {
  it('should return 401 response with WWW-Authenticate header', () => {
    const response = respondRequiringAuth();

    expect(response).toBeTruthy();
    expect(response.status).toBe(401);
    expect(response.headers.get('WWW-Authenticate')).toBeTruthy();
  });
});
