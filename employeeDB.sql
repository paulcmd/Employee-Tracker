DROP DATABASE IF EXISTS employeeDB;

CREATE DATABASE employeeDB;

USE employeeDB;

CREATE TABLE department
(
    id   INT         NOT NULL AUTO_INCREMENT,
    name VARCHAR(30) NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE role
(
    id            INT         NOT NULL AUTO_INCREMENT,
    title         VARCHAR(30) NOT NULL,
    salary        DECIMAL     NOT NULL,
    department_id INT,

    PRIMARY KEY (id),

    FOREIGN KEY (department_id) REFERENCES department (id)
);

CREATE TABLE employee
(
    id         INT         NOT NULL AUTO_INCREMENT,
    first_name VARCHAR(30) NOT NULL,
    last_name  VARCHAR(30) NOT NULL,
    role_id    INT         NOT NULL,
    manager_id INT,

    PRIMARY KEY (id),

    FOREIGN KEY (role_id) REFERENCES role (id),
    FOREIGN KEY (manager_id) REFERENCES employee (id)
);

-- ==============================================================================

-- create departments
INSERT INTO department (name)
VALUES ("Administration"),
       ("Employee Resources"),
       ("Distribution"),
       ("Design & Marketing"),
       ("Store Operations");

-- create the roles in each department
INSERT INTO role (title, salary, department_id)
VALUES
       ("Accountant", 76000, 2),                -- 3
       ("HR Generalist", 40000, 2),             -- 3

       ("Distribution Director", 80000, 3),     -- 3
       ("Distribution Operator", 23000, 3),     -- 6

       ("Head of Production", 50000, 4),        -- 1
       ("Creative Designer", 50000, 4),         -- 3


       ("Store Director", 85000, 5),            -- 3
       ("Customer Service Rep", 32000, 5);      -- 6

-- create the CEO (has no manager)
INSERT INTO employee (first_name, last_name, role_id)
VALUES ("Allan", "Decosta", 1);

-- create the other employees (all have a manager)
INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES ("Caryl", "Evans", 2, 1),           -- 2
       ("Jill", "Vega", 3, 1),           -- 3
       ("Locky", "Morris", 4, 1),         -- 4
       ("Julia ", "Little", 5, 1),     -- 5

       ("Ron", "Clark", 6, 2),           -- 6
       ("Nell", "Welder", 7, 6),         -- 7
       ("Paul", "Bradley", 7, 6),  -- 8
       ("Locky", "Morris", 7, 6),       -- 9
       ("Alan", "Johnston", 8, 6),          -- 10
       ("Elssie", "Parre", 8, 6),     -- 11
       ("Sue", "White", 8, 6)            -- 12




