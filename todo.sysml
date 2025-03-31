package todo {
    /* TodoService is the main business logic component.
       It coordinates operations between the API layer and storage,
       handles validation, and enforces business rules. */
    part def TodoService {
        operations {
            /* Core CRUD operations for todo items.
               Each operation returns a result to confirm success
               or provide requested data. */
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
                in updates: TodoItemUpdates;  /* Partial updates allowed */
                out result: TodoItem;
            }
            action deleteTodo {
                in id: UUID;
            }
        }
    }

    /* TodoItem represents a single todo item in the system.
       This is the core data structure that gets persisted
       and manipulated throughout the application. */
    part def TodoItem {
        attributes {
            id: UUID;                /* Unique identifier */
            title: String;           /* Short description */
            description: String;     /* Detailed description */
            status: Status;         /* Current state of the todo */
            createdAt: DateTime;    /* When the item was created */
            updatedAt: DateTime;    /* When the item was last modified */
        }
    }

    /* TodoItemUpdates defines what fields can be modified when updating a todo.
       The [0..1] notation means these fields are optional - only include
       what needs to be changed. */
    part def TodoItemUpdates {
        attributes {
            title: String[0..1];       /* Optional title update */
            description: String[0..1];  /* Optional description update */
            status: Status[0..1];      /* Optional status update */
        }
    }

    /* Status represents the possible states of a todo item.
       This ensures only valid states can be assigned. */
    enum Status {
        PENDING;        /* Initial state */
        IN_PROGRESS;    /* Work has started */
        COMPLETED;      /* Work is done */
    }

    /* TodoStorage defines the interface for persistence operations.
       This abstraction allows for different storage implementations
       (e.g., in-memory, database, file system) without changing
       the rest of the system. */
    interface def TodoStorage {
        /* CRUD operations that any storage implementation must provide */
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
            in id: UUID;
            in updates: TodoItemUpdates;
            out result: TodoItem;
        }
        action deleteTodo {
            in id: UUID;
        }
    }

    /* This association shows that TodoService depends on TodoStorage.
       The [1] multiplicity means each service must have exactly one storage implementation. */
    association {
        end service: TodoService[1];
        end storage: TodoStorage[1];
    }

    /* This association shows that TodoStorage manages TodoItems.
       The [0..*] multiplicity means a storage can manage zero or more items. */
    association {
        end storage: TodoStorage[1];
        end items: TodoItem[0..*];
    }
}
