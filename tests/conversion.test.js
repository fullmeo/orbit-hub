const { convertEURtoUSDC, clearCache } = require('../backend/services/conversion.js');

global.fetch = jest.fn();

describe('EUR→USDC Conversion Service', () => {
  beforeEach(() => {
    clearCache();
    jest.clearAllMocks();
  });

  describe('Conversion Accuracy', () => {
    it('should convert 5 EUR to ~5.5 USDC', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          pairs: [{ from: 'EUR', to: 'USDC', rate: 1.1 }],
        }),
      });

      const result = await convertEURtoUSDC(5);
      expect(result).toBe(5.5);
    });

    it('should convert 10 EUR to 11 USDC', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          pairs: [{ from: 'EUR', to: 'USDC', rate: 1.1 }],
        }),
      });

      const result = await convertEURtoUSDC(10);
      expect(result).toBe(11);
    });

    it('should round to 2 decimal places', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          pairs: [{ from: 'EUR', to: 'USDC', rate: 1.1999 }],
        }),
      });

      const result = await convertEURtoUSDC(7);
      expect(result).toBe(8.4); // 7 * 1.1999 = 8.3993 -> 8.4
    });

    it('should throw for zero or negative amounts', async () => {
      await expect(convertEURtoUSDC(0)).rejects.toThrow('Amount must be positive');
      await expect(convertEURtoUSDC(-5)).rejects.toThrow('Amount must be positive');
    });
  });

  describe('Caching', () => {
    it('should cache exchange rate for 1 hour', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          pairs: [{ from: 'EUR', to: 'USDC', rate: 1.1 }],
        }),
      });

      await convertEURtoUSDC(5);
      await convertEURtoUSDC(10);

      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should use cache even if expired when API fails', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          pairs: [{ from: 'EUR', to: 'USDC', rate: 1.1 }],
        }),
      });
      await convertEURtoUSDC(5);

      fetch.mockRejectedValueOnce(new Error('API down'));
      fetch.mockResolvedValueOnce({ ok: false, status: 500 });

      const result = await convertEURtoUSDC(10);
      expect(result).toBe(11); // Uses cached 1.1 rate
    });
  });

  describe('API Error Handling', () => {
    it('should fallback to hardcoded rate when no cache and API fails', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await convertEURtoUSDC(5);
      expect(result).toBe(5.5); // Fallback 1.1 rate
    });
  });

  describe('Circle API Integration', () => {
    it('should call Circle API with correct auth', async () => {
      process.env.CIRCLE_API_KEY = 'test-key';
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          pairs: [{ from: 'EUR', to: 'USDC', rate: 1.1 }],
        }),
      });

      await convertEURtoUSDC(5);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.sandbox.circle.com/v1/configuration/payment/fiat-currency-pairs',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-key',
          }),
        })
      );

      delete process.env.CIRCLE_API_KEY;
    });

    it('should handle missing CIRCLE_API_KEY gracefully', async () => {
      delete process.env.CIRCLE_API_KEY;
      fetch.mockRejectedValueOnce(new Error('No API key'));

      const result = await convertEURtoUSDC(5);
      expect(result).toBe(5.5);
    });
  });
});
