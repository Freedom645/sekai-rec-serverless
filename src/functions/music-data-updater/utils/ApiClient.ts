import axios from 'axios';

export class ApiClient {
  constructor(private readonly BASE_URL: string) {}

  public get<T>(path: string): Promise<T> {
    return axios.get<T>(this.BASE_URL + path).then((res) => res.data);
  }
}
