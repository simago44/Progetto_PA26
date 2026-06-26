export interface Repository<T> { 
  save(t: T): T;
  loadByPk(id: string): T;
  loadAll(): T[];
  update(t: T): T;
  delete(t: T): T;
}