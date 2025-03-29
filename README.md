<h1>Like vibe-coding, but bulletproof and trustworthy</h1>

- [What is this all about?](#what-is-this-all-about)
- [SysML and MBSE](#sysml-and-mbse)
- [Test-driven development](#test-driven-development)
- [Example: a simple web service](#example-a-simple-web-service)
  - [Making UML diagrams](#making-uml-diagrams)
- [How can a LLM help me implement this design?](#how-can-a-llm-help-me-implement-this-design)
  - [1. REST API Service](#1-rest-api-service)
  - [2. Microservice Architecture](#2-microservice-architecture)
  - [3. Serverless Implementation](#3-serverless-implementation)
  - [4. Desktop/Mobile Application](#4-desktopmobile-application)
  - [5. Database-Centric Implementation](#5-database-centric-implementation)
  - [6. Event-Driven Architecture](#6-event-driven-architecture)

## What is this all about?

As software developers, we have no viable choice but to embrace
AI-assisted software design and development. What follows in my
attempt to come up with a process that produces bulletproof,
trustworthy designs and code.

When one starts using AI assistance, the language model very quickly
produces a large, complex design. A detailed review of the design
would take a long time, much longer than it took to generate the
code. Perhaps it would be possible to write a tool that could
review the design almost as quickly as it was produced.

My first thought was to use a test-driven development (TDD) process.
The AI can help write the tests, and then the code can be written to
pass the tests. Reviewing the tests would hopefully be more intuitive
and straightforward than reviewing the functional design. Passing the
tests would give confidence that the design is correct.

To build further confidence in the design, we can establish a robust
architectural framework that enumerates interfaces and interactions:

- SysML models used to generate code and tests
- mocks or stubs in Python
- mocks or stubs in Rust
- models derived from MBSE tools

and these would need to be complete enough to allow testing the
correctness of the design up to this point.

The overall goal is to produce a design in a way that takes advantage
of the speed of language models, while still being easy for the developer
to understand, modify, and verify correctness.

## SysML and MBSE

SysML is a language for specifying the architecture of a system, while
MBSE (Model-Based Systems Engineering) provides methodologies for using it.
There are open-source tools that support SysML/MBSE development and validation:

- [Eclipse Papyrus](https://www.eclipse.org/papyrus/) - Includes modeling and validation framework
- [Capella](https://www.eclipse.org/capella/) - Focuses on MBSE practices

These tools help ensure designs are both complete and correct through their
built-in validation capabilities.

Validation tools can help us make sure that the design is correct
and complete. Eclipse Papyrus has a validation framework that
can help us validate our SysML models.

## Test-driven development

To make this work well, we want to first sketch out a block diagram
of the design. We can do this in SysML, and in conversation with an
LLM or AI assistant.

Initially the system could be represented as a collection of mocks
or stubs with the interfaces we want, but toy implementations. Against
these we can write a test suite, and then implement the system to pass
the tests.

## Example: a simple web service

Let's say we want to design a simple web service that can be used to
manage a todo list. We can start by sketching out a block diagram of
the system. `todo.sysml` is a simple block diagram of the system in
SysML. This gives us a starting point with:

- Core domain entities
- Basic operations
- Key relationships
- Standard tracking fields

---

<details>
<summary><tt>todo.sysml</tt></summary>

```sysml
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

    association {
        end service: TodoService[1];
        end items: TodoItem[0..*];
    }
}
```

</details>

---


### Making UML diagrams

PlantUML is a tool that can generate diagrams from SysML models. To
get there we need an intermediate representation. The input language
for PlantUML is called [PUML](https://plantuml.com/puml).

The easiest way to get there is to ask Claude.AI to convert the SysML
model to PUML. My prompt was very simple, and I copied the result
into `todo.puml`.

> Please convert this to PlantUML so I can generate UML diagrams.

Alternatively, the AI assistant in Cursor IDE can perform the
conversion for us. We want to ensure that the SysML model is the
only source of truth for the design.

Then we can use `todo.puml` to generate a UML diagram:

```bash
sudo apt install plantuml
plantuml todo.puml > todo.png
```

<img src="todo.png" alt="Todo list web service block diagram" />

---

## How can a LLM help me implement this design?

Now that we've got a test suite ready, we can move on to implementing
the system. I handed `todo.sysml` to Claude.AI and asked the following prompts:

> What are my options for implementing the system described here?

Looking at your SysML model for a Todo service, I see you have a
well-structured definition of a basic task management system. Let me outline
several implementation options for you. Your choice would depend on factors
like expected scale, integration requirements, performance needs, and your
team's expertise.

### 1. REST API Service

You could implement this as a RESTful web service with endpoints that map directly to your operations:
- `POST /todos` for `addTodo`
- `GET /todos/{id}` for `getTodo`
- `GET /todos` for `listTodos`
- `PUT /todos/{id}` for `updateTodo`
- `DELETE /todos/{id}` for `deleteTodo`

This would work well with frameworks like Spring Boot (Java), Express.js (Node.js), Django/Flask (Python), or ASP.NET Core (C#).

### 2. Microservice Architecture

Your TodoService could be implemented as a standalone microservice, potentially with:
- A separate database for storing TodoItems
- Message queue integration for async operations
- API gateway for client interaction
- Service discovery and configuration management

### 3. Serverless Implementation

The operations could be mapped to serverless functions (AWS Lambda, Azure Functions, Google Cloud Functions):
- Each action becomes a separate function
- DynamoDB or similar for storing TodoItems
- API Gateway to expose endpoints

### 4. Desktop/Mobile Application

You could create a standalone desktop or mobile app:
- Local database for TodoItems (SQLite, Realm, etc.)
- GUI components corresponding to each operation
- Local notifications for due dates or status changes

### 5. Database-Centric Implementation

A database-first approach where:
- TodoItems are stored in a table/collection
- Operations are implemented as stored procedures or ORM methods
- Business logic lives close to the data

### 6. Event-Driven Architecture

An event-based system where:
- Actions publish events (TodoCreated, TodoUpdated, etc.)
- Services subscribe to relevant events
- Event store maintains history of all changes
