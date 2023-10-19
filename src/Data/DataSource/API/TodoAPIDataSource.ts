import { Todo } from "../../../Domain/Model/Todo";
import TodoDataSource from "../TodoDataSource";
import { TodoAPIEntity } from "./Entity/TodoAPIEntity";
import localDB from "./LocalDB";


const BASE_URL = "http://localhost:8000";

interface TypedResponse<T = any> extends Response {
  json<P = T>(): Promise<P>;
}

function myFetch<T>(...args: any): Promise<TypedResponse<T>> {
  return fetch.apply(window, args);
}

export default class TodoAPIDataSourceImpl implements TodoDataSource {
  async getTodos(): Promise<Todo[]> {
    let response = await myFetch<any>(`${BASE_URL}/todo/`);
    let data = await response.json();
    return data.results.map((item:TodoAPIEntity) => ({
      id: item.id,
      title: item.title,
      isComplete: item.isComplete,
    }));
  }

  createTodo(value: string): Promise<Todo> {
    const newTodoData = {
      title: value,
      is_completed: false
    };
    return fetch(`${BASE_URL}/todo/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newTodoData),
    })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Error al crear la tarea');
          }
          return response.json();
        })
        .then((createdTodo) => {
          return {
            id: createdTodo.id,
            title: createdTodo.title,
            isComplete: createdTodo.is_completed,
          };
        })
        .catch((error) => {
          // Maneja el error, por ejemplo, registrándolo o lanzándolo nuevamente.
          throw error;
        });
  }

  removeTodo(id: string): Promise<boolean> {
    return fetch(`${BASE_URL}/todo/${id}/`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Error al eliminar la tarea');
          }
          return true;
        })
        .catch((error) => {
          throw error;
        });
  }

  toggleTodoCheck(id: string): Promise<boolean> {
    return fetch(`${BASE_URL}/todo/${id}/`)
        .then((response) => {
          if (!response.ok) {
            throw new Error('Error al obtener la tarea');
          }
          return response.json();
        })
        .then((existingTodo) => {
          existingTodo.isComplete = !existingTodo.isComplete;
          return fetch(`${BASE_URL}/todo/${id}/`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(existingTodo),
          });
        })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Error al actualizar la tarea');
          }
          return response.json();
        })
        .then((existingTodo) => {
           return existingTodo.isComplete;
        });
  }
}

export class TodoAPIDataSourceImpl2 implements TodoDataSource {
  db = localDB<TodoAPIEntity>("todos");
  async createTodo(value: string) {
    const res: Todo = {
      id: new Date().getSeconds().toString(),
      isComplete: false,
      title: value,
    };

    this.db.create({
      id: res.id,
      is_completed: res.isComplete,
      title: res.title,
    });
    return res;
  }

  async getTodos(): Promise<Todo[]> {
    const data = this.db?.getAll();

    return data?.map((item) => ({
      id: item.id,
      title: item.title,
      isComplete: item.isComplete,
    }));
  }

  async toggleTodoCheck(id: string) {
    const item = this.db.updateByField(id, "is_completed", "toggle");
    return item.isComplete;
  }

  async removeTodo(id: string) {
    return this.db.removeById(id);
  }
}
