package todo {
    part def TodoService {
        operations {
            action addTodo {
                in title: String;
                in description: String;
                out result: TodoItem;
            }
            action getTodo {
                in id: UUID;
                out result: TodoItem;
            }
            action listTodos {
                out result: List;
            }
            action updateTodo {
                in id: UUID;
                in status: Status;
                out result: TodoItem;
            }
            action deleteTodo {
                in id: UUID;
            }
        }
    }

    part def TodoItem {
        attributes {
            id: UUID;
            title: String;
            description: String;
            status: Status;
            createdAt: DateTime;
            updatedAt: DateTime;
        }
    }

    enum Status {
        PENDING;
        IN_PROGRESS;
        COMPLETED;
    }

    /* Storage abstraction layer */
    interface def TodoStorage {
        action createTodo {
            in item: TodoItem;
            out result: TodoItem;
        }
        action getTodo {
            in id: UUID;
            out result: TodoItem;
        }
        action listTodos {
            out result: List;
        }
        action updateTodo {
            in item: TodoItem;
            out result: TodoItem;
        }
        action deleteTodo {
            in id: UUID;
        }
    }

    /* Service uses storage */
    association {
        end service: TodoService[1];
        end storage: TodoStorage[1];
    }

    /* Items are managed by storage */
    association {
        end storage: TodoStorage[1];
        end items: TodoItem[0..*];
    }
}
