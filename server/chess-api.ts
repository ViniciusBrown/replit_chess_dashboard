import axios from 'axios';

// Error handling wrapper
async function safeApiCall<T>(apiCall: () => Promise<T>): Promise<[T | null, Error | null]> {
  try {
    const result = await apiCall();
    return [result, null];
  } catch (error) {
    console.error('API call failed:', error);
    return [null, error instanceof Error ? error : new Error(String(error))];
  }
}

// Lichess API
export const lichessApi = {
  async getUserGames(username: string, token?: string, since?: Date, until?: Date, max = 10): Promise<[any | null, Error | null]> {
    return safeApiCall(async () => {
      const headers: Record<string, string> = {
        'Accept': 'application/x-ndjson'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      let url = `https://lichess.org/api/games/user/${username}`;
      const params: Record<string, string> = {
        max: max.toString(),
        pgnInJson: 'true',
        clocks: 'true',
        opening: 'true'
      };
      
      if (since) {
        params.since = Math.floor(since.getTime() / 1000).toString();
      }
      
      if (until) {
        params.until = Math.floor(until.getTime() / 1000).toString();
      }
      
      const response = await axios.get(url, { 
        headers,
        params
      });
      
      // Lichess returns ndjson, so we need to parse it
      const games = response.data
        .split('\n')
        .filter(Boolean)
        .map((line: string) => JSON.parse(line));
        
      return games;
    });
  },
  
  async getOAuthUrl(): Promise<string> {
    const clientId = process.env.LICHESS_CLIENT_ID || 'default-client-id';
    const redirectUri = encodeURIComponent(process.env.LICHESS_REDIRECT_URI || 'http://localhost:5000/api/oauth/lichess/callback');
    return `https://lichess.org/oauth?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=study:read game:read`;
  },
  
  async exchangeCodeForToken(code: string): Promise<[string | null, Error | null]> {
    return safeApiCall(async () => {
      const clientId = process.env.LICHESS_CLIENT_ID || 'default-client-id';
      const clientSecret = process.env.LICHESS_CLIENT_SECRET || 'default-client-secret';
      const redirectUri = process.env.LICHESS_REDIRECT_URI || 'http://localhost:5000/api/oauth/lichess/callback';
      
      const response = await axios.post('https://lichess.org/api/token', 
        {
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.access_token;
    });
  },
  
  async getAccountInfo(token: string): Promise<[any | null, Error | null]> {
    return safeApiCall(async () => {
      const response = await axios.get('https://lichess.org/api/account', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return response.data;
    });
  }
};

// Chess.com API
export const chessComApi = {
  async getUserGames(username: string, year?: number, month?: number): Promise<[any | null, Error | null]> {
    return safeApiCall(async () => {
      let url = `https://api.chess.com/pub/player/${username}/games`;
      
      if (year && month) {
        // Format month to be 2 digits (e.g., 01, 02, ..., 12)
        const formattedMonth = month.toString().padStart(2, '0');
        url = `https://api.chess.com/pub/player/${username}/games/${year}/${formattedMonth}`;
      } else {
        url = `https://api.chess.com/pub/player/${username}/games/archives`;
        const archives = await axios.get(url);
        
        // Get the most recent archive
        if (archives.data.archives && archives.data.archives.length > 0) {
          url = archives.data.archives[archives.data.archives.length - 1];
        } else {
          throw new Error('No game archives found');
        }
      }
      
      const response = await axios.get(url);
      return response.data.games || [];
    });
  },
  
  async getPlayerProfile(username: string): Promise<[any | null, Error | null]> {
    return safeApiCall(async () => {
      const response = await axios.get(`https://api.chess.com/pub/player/${username}`);
      return response.data;
    });
  }
};
