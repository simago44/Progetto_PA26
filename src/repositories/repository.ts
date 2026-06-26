export interface Repository<T> { 
  save(t: T): Promise<T>;
  loadByPk(id: string): Promise<T>;
  loadAll(): Promise<T[]>;
  update(t: T): Promise<T>;
  delete(t: T): Promise<void>;
}