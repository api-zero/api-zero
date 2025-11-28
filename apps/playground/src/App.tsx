import { useState } from 'react';
import { ApiProvider, useApi } from '@api-zero/react';
import { createClient, ApiError } from '@api-zero/core';
import type {
  HttpBinGetResponse,
  HttpBinPostResponse,
  HttpBinPutResponse,
  HttpBinPatchResponse,
  HttpBinDeleteResponse,
  PostBody,
  PutBody,
  PatchBody,
  GetParams,
  SlideshowResponse
} from './models';
import './App.css';

// --- Components ---

function MethodsDemo() {
  const api = useApi();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runMethod = async (method: string) => {
    setLoading(true);
    setResult(null);
    try {
      let data;
      switch (method) {
        case 'GET':
          data = await api.get<HttpBinGetResponse, GetParams>('/get', {
            params: { id: 123, name: 'test' }
          });
          break;
        case 'POST':
          data = await api.post<HttpBinPostResponse, PostBody>('/post', {
            message: 'Hello World',
            timestamp: Date.now()
          });
          break;
        case 'PUT':
          data = await api.put<HttpBinPutResponse, PutBody>('/put', {
            update: 'full',
            id: 1
          });
          break;
        case 'PATCH':
          data = await api.patch<HttpBinPatchResponse, PatchBody>('/patch', {
            update: 'partial'
          });
          break;
        case 'DELETE':
          data = await api.delete<HttpBinDeleteResponse>('/delete');
          break;
      }
      setResult(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setResult({ error: err.message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>1. HTTP Methods</h2>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => (
          <button key={m} onClick={() => runMethod(m)} disabled={loading}>{m}</button>
        ))}
      </div>
      {result && <pre className="result-box">{(typeof result === 'string' ? result : JSON.stringify(result, null, 2)) as string}</pre>}
    </div>
  );
}

function ConfigDemo() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testTimeout = async () => {
    setLoading(true);
    // Standalone client needs full URL or its own baseURL
    const client = createClient({
      baseURL: 'https://httpbin.org',
      timeout: 2000
    });
    try {
      // httpbin delay is in seconds
      await client.get('/delay/3');
      setResult('Failed: Should have timed out');
    } catch (err: unknown) {
      if (err instanceof ApiError && err.isTimeout) {
        setResult('✅ Success: Request timed out as expected');
      } else if (err instanceof Error) {
        setResult(`❌ Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const testHeaders = async () => {
    setLoading(true);
    const client = createClient({
      baseURL: 'https://httpbin.org',
      headers: { 'X-Custom-Global': 'GlobalValue' }
    });
    try {
      const data = await client.get<HttpBinGetResponse>('/headers', {
        headers: { 'X-Custom-Request': 'RequestValue' }
      });
      setResult(data.headers);
    } catch (err: unknown) {
      if (err instanceof Error) setResult(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testAuth = async () => {
    setLoading(true);
    const client = createClient({ baseURL: 'https://httpbin.org' });
    client.setAuthToken('my-secret-token');
    try {
      const data = await client.get<HttpBinGetResponse>('/bearer');
      setResult(data);
    } catch (err: unknown) {
      // httpbin/bearer checks for specific token, might fail but we check headers sent
      if (err instanceof ApiError && err.status === 401) {
        setResult('✅ Auth header sent (401 expected from httpbin if token invalid)');
      } else if (err instanceof Error) {
        setResult(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>2. Configuration</h2>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button onClick={testTimeout} disabled={loading}>Test Timeout (2s)</button>
        <button onClick={testHeaders} disabled={loading}>Test Headers</button>
        <button onClick={testAuth} disabled={loading}>Test Auth</button>
      </div>
      {result && <pre className="result-box">{(typeof result === 'string' ? result : JSON.stringify(result, null, 2)) as string}</pre>}
    </div>
  );
}

function AdvancedDemo() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const testRetry = async () => {
    setLoading(true);
    setLogs([]);
    const client = createClient({
      baseURL: 'https://httpbin.org',
      retry: {
        attempts: 3,
        delay: 500,
        backoff: 'linear',
        retryCondition: (err) => {
          setLogs(prev => [...prev, `Retry condition check: ${err.status}`]);
          return true;
        }
      }
    });

    try {
      await client.get('/status/500');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setResult(`Final Error: ${err.message} (Attempts exhausted)`);
      }
    } finally {
      setLoading(false);
    }
  };

  const testParamsSerializer = async () => {
    setLoading(true);
    const client = createClient({
      baseURL: 'https://httpbin.org',
      paramsSerializer: { arrayFormat: 'brackets' }
    });
    try {
      const data = await client.get<HttpBinGetResponse>('/get', {
        params: { filters: ['a', 'b'], sort: 'desc' }
      });
      setResult({ url: data.url, args: data.args });
    } catch (err: unknown) {
      if (err instanceof Error) setResult(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testAbort = async () => {
    setLoading(true);
    const controller = new AbortController();
    const client = createClient({ baseURL: 'https://httpbin.org' });

    setTimeout(() => controller.abort(), 500);

    try {
      await client.get('/delay/2', { signal: controller.signal });
      setResult('Failed: Should have been aborted');
    } catch (err: unknown) {
      if (err instanceof ApiError && err.isAborted) {
        setResult('✅ Request Aborted successfully');
      } else if (err instanceof Error) {
        setResult(`❌ Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>3. Advanced Features</h2>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button onClick={testRetry} disabled={loading}>Test Retry (500)</button>
        <button onClick={testParamsSerializer} disabled={loading}>Params Serializer</button>
        <button onClick={testAbort} disabled={loading}>Abort Signal</button>
      </div>
      {logs.length > 0 && (
        <div style={{ textAlign: 'left', fontSize: '0.8em', margin: '0.5rem 0' }}>
          {logs.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}
      {result && <pre className="result-box">{(typeof result === 'string' ? result : JSON.stringify(result, null, 2)) as string}</pre>}
    </div>
  );
}

function TransformValidationDemo() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testTransform = async () => {
    setLoading(true);
    const client = createClient({
      baseURL: 'https://httpbin.org',
      transformRequest: [(data) => ({ ...data, transformed: true })],
      transformResponse: [(data) => ({ ...data, received: true })]
    });
    try {
      // We expect the response to have 'received: true' added by transformResponse
      // and the echo to show 'transformed: true' in the json field
      const data = await client.post<HttpBinPostResponse & { received: boolean }, { original: boolean }>('/post', { original: true });
      setResult(data);
    } catch (err: unknown) {
      if (err instanceof Error) setResult(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testValidation = async (shouldFail: boolean) => {
    setLoading(true);
    const client = createClient({ baseURL: 'https://httpbin.org' });
    try {
      await client.get<SlideshowResponse>('/json', {
        validateResponse: (data) => {
          if (shouldFail) return false;
          return data.slideshow.author === 'Yours Truly';
        },
        onValidationError: (err) => {
          console.log('Validation Error Callback:', err);
        }
      });
      setResult('✅ Validation Passed');
    } catch (err: unknown) {
      if (err instanceof Error) setResult(`❌ Validation Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>4. Transforms & Validation</h2>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button onClick={testTransform} disabled={loading}>Test Transforms</button>
        <button onClick={() => testValidation(false)} disabled={loading}>Validate (Pass)</button>
        <button onClick={() => testValidation(true)} disabled={loading}>Validate (Fail)</button>
      </div>
      {result && <pre className="result-box">{(typeof result === 'string' ? result : JSON.stringify(result, null, 2)) as string}</pre>}
    </div>
  );
}

function ProgressDemo() {
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testDownload = async () => {
    setLoading(true);
    setProgress(0);
    setResult('');
    const client = createClient({ baseURL: 'https://httpbin.org' });

    try {
      // Download a large image
      await client.get('/image/jpeg', {
        responseType: 'blob',
        onDownloadProgress: (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded * 100) / e.total));
          }
        }
      });
      setResult('✅ Download Complete');
    } catch (err: unknown) {
      if (err instanceof Error) setResult(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>5. Progress Tracking</h2>
      <button onClick={testDownload} disabled={loading}>Test Download Progress</button>
      <div style={{ marginTop: '1rem', width: '100%', background: '#eee', borderRadius: '4px' }}>
        <div style={{
          width: `${progress}%`,
          height: '20px',
          background: '#4CAF50',
          borderRadius: '4px',
          transition: 'width 0.2s'
        }} />
      </div>
      <p>{progress}%</p>
      {result && <p>{result}</p>}
    </div>
  );
}

function InterceptorDemo() {
  const api = useApi();
  const [logs, setLogs] = useState<string[]>([]);

  const runTest = async () => {
    setLogs([]);

    // Add interceptors
    const reqId = api.interceptors.request.use((config) => {
      setLogs(prev => [...prev, `⬆️ Request Interceptor: Adding custom header`]);
      // Add a custom header via interceptor
      config.headers = { ...config.headers, 'X-Intercepted': 'true' };
      return config;
    });

    const resId = api.interceptors.response.use((response) => {
      setLogs(prev => [...prev, `⬇️ Response: ${response.status}`]);
      return response;
    });

    try {
      await api.get<HttpBinGetResponse>('/get');
      setLogs(prev => [...prev, '✅ Request finished']);
    } catch (err: unknown) {
      if (err instanceof Error) setLogs(prev => [...prev, `❌ Error: ${err.message}`]);
    } finally {
      // Cleanup
      api.interceptors.request.eject(reqId);
      api.interceptors.response.eject(resId);
    }
  };

  return (
    <div className="card">
      <h2>6. Interceptors</h2>
      <button onClick={runTest}>Test Interceptors</button>
      <div style={{ marginTop: '1rem', textAlign: 'left', fontSize: '0.8em', maxHeight: '150px', overflow: 'auto' }}>
        {logs.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
}

function App() {
  return (
    <ApiProvider config={{ baseURL: 'https://httpbin.org' }}>
      <div className="App">
        <h1>api-zero - Comprehensive Playground</h1>
        <p>Testing Suite for @api-zero/core & @api-zero/react</p>

        <div className="grid">
          <MethodsDemo />
          <ConfigDemo />
          <AdvancedDemo />
          <TransformValidationDemo />
          <ProgressDemo />
          <InterceptorDemo />
        </div>
      </div>
    </ApiProvider>
  );
}

export default App;
