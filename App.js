// ==============================================================================
// DEPENDENCIES
// Series of npm packages that we will use to give our server useful functionality
// ==============================================================================

const mysql = require("mysql");
const inquirer = require("inquirer");
const consoleTable = require("console.table");


// ==============================================================================
// MYSQL CONFIGURATION
// This sets up the basic properties for our mysql connection
// ==============================================================================

// Create a connection to the DB
const connection = mysql.createConnection({
    host: "localhost",

    // Your port; if not 3306
    port: 3306,

    // Your username
    user: "root",

    // Your password
    password: "root",
    database: "employeeDB"
});


// Initiates the connection to the DB
// =============================================================
connection.connect(function (err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId);
    init();

});


// =======================================================================================
// GET ALL DEPARTMENTS, ROLES, EMPLOYEES, & MANAGERS into an array
// =======================================================================================

const getFunctions = {

    getDepartments: function (arr) {
        connection.query("SELECT name FROM department;", function (err, res) {
            if (err) throw err;
            //From each dept, get dept name
            let departmentsArray = res.map(dept => dept.name);
            console.table(departmentsArray);
            arr(departmentsArray);
        });
    },


    getRoles: function (arr) {
        connection.query("SELECT title FROM role;", function (err, res) {
            if (err) throw err;
            let rolesArray = res.map(role => role.title);
            console.table(rolesArray);
            arr(rolesArray);
        });
    },

    getEmployees: function (arr) {
        connection.query(
                `SELECT CONCAT(employee.first_name, ' ', employee.last_name) AS full_name
                 FROM employee;`,
            function (err, res) {
                if (err) throw err;
                let employeesArray = res.map(employee => employee.full_name);
                arr(employeesArray);
            });
    },


    getManagers: function (arr) {
        connection.query(
                `
                    SELECT CONCAT(employee.first_name, ' ', employee.last_name) AS manager_name
                    FROM employee
                             JOIN role ON employee.role_id = role.id
                    WHERE (role.title = "Chief Executive Officer")
                       OR (role.title = "Chief of Finance")
                       OR (role.title = "Chief of Distribution")
                       OR (role.title = "Chief of Production")
                       OR (role.title = "Chief of Retail")
                       OR (role.title = "Head of Employment")
                       OR (role.title = "Distribution Director")
                       OR (role.title = "Head of Production")
                       OR (role.title = "Store Director")
                    ORDER BY employee.id ASC;`,
            function (err, res) {
                if (err) throw err;
                let managerNamesArray = res.map(employee => employee.manager_name);
                console.table(managerNamesArray);
                arr(managerNamesArray);
            }
        );
    }
}


// =======================================================================================
// VIEW RELATION BETWEEN TWO TABLES (employees, managers, departments, roles)
// =======================================================================================

const viewRelation = {
    managersSubordinates: function (manager_name, cb) {
        connection.query(
                `
                    SELECT employee.id,
                           CONCAT(first_name, ' ', last_name) AS full_name,
                           role.title,
                           department.name                    AS department,
                           role.salary
                    FROM employee
                             LEFT JOIN role ON employee.role_id = role.id
                             LEFT JOIN department ON role.department_id = department.id
                    WHERE manager_id IN (SELECT id FROM employee WHERE CONCAT(first_name, ' ', last_name) = ?);`,
            manager_name,
            function (err, res) {
                if (err) throw err;
                cb(res);
            }
        );
    },

    employeesByDepartment: function (dep_name, cb) {
        connection.query(
                `SELECT employee.id,
                        CONCAT(employee.first_name, ' ', employee.last_name) AS full_name,
                        role.title,
                        role.salary
                 FROM department
                          LEFT JOIN role ON role.department_id = department.id
                          LEFT JOIN employee ON employee.role_id = role.id
                 WHERE name = ?;`,
            dep_name,
            function (err, res) {
                if (err) throw err;
                cb(res);
            }
        );
    },

    employeesByRole: function (role_title, cb) {
        connection.query(
                `SELECT employee.id, CONCAT(employee.first_name, ' ', employee.last_name) AS full_name
                 FROM role
                          LEFT JOIN employee ON employee.role_id = role.id
                 WHERE title = ?;`,
            role_title,
            function (err, res) {
                if (err) throw err;
                cb(res);
            }
        );
    },
};

// =======================================================================================
// VALIDATE USER INPUT (for appropriate string length or use of numbers)
// =======================================================================================

function validateInput(input) {
    if (input.length > 30 || input.length < 1) {
        return "input must be between 1 and 30 characters";
    }
    return true;
}

function validateNumber(number) {
    const reg = /^\d+$/;
    return reg.test(number) || "enter a NUMBER";
}

// =======================================================================================
// INITIATE APPLICATION
// =======================================================================================

const init = function () {
    inquirer.prompt(
        {
            type: "list",
            message: "Welcome to the Employee Manager : What would you like to do?",
            name: "landingPage",
            choices: [
                {
                    name: "Go to Departments ==>",
                    value: "departments"
                },
                {
                    name: "Go to Employees ==>",
                    value: "employees"
                },
                {
                    name: "Go to Roles ==>",
                    value: "roles"
                },
                {
                    name: "Exit App.",
                    value: "exit"
                }
            ]
        }
    ).then(response => {
        switch (response.landingPage) {
            case "departments":
                departments();
                break;
            case "employees":
                employees();
                break;
            case "roles":
                roles();
                break;
            default:
                console.log("Disconnecting from database...");
                connection.end();
                console.log("Connection terminated.")
                return;
        }
    })

}

// =======================================================================================
// Departments
// =======================================================================================

function departments() {
    // ask what they want to do
    inquirer.prompt(
        {
            type: "list",
            name: "departmentChoice",
            message: "What would you like to do in departments?",
            choices: [
                {
                    name: "View all departments.",
                    value: "viewDepts"
                },
                {
                    name: "Add a department.",
                    value: "addDept"
                },
                {
                    name: "Delete a department.",
                    value: "delDept"
                },
            ]
        }
    ).then(answer => {
        switch (answer.departmentChoice) {
            case "viewDepts":
                viewAllDepts();
                break;
            case "addDept":
                addDept();
                break;
            case "delDept":
                deleteDept();
                break;
        }
    })
    // view, edit, or add departments
}

// =======================================================================================
// View all Departments
// =======================================================================================
function viewAllDepts() {
    connection.query("SELECT * FROM department", function (err, res) {
        if (err) throw err
        console.table(res)
        inquirer.prompt(
            {
                type: "list",
                name: "afterView",
                message: "What would you like to do?",
                choices: [
                    {
                        name: "Go back to Department page.",
                        value: "backDept"
                    },
                    {
                        name: "Go back to Main Page.",
                        value: "backMain"
                    },
                    {
                        name: "Exit Program",
                        value: "exit"
                    }
                ]
            }
        ).then(choice => {
            switch (choice.afterView) {
                case "backDept":
                    departments();
                    break;
                case "backMain":
                    init();
                    break;
                default:
                    connection.end();
                    return;
            }
        })
    })
}

// =======================================================================================
// Add a Department
// =======================================================================================
function addDept() {
    inquirer.prompt([
        {
            name: "name",
            type: "input",
            message: "What Department would you like to Add?",
            validate: validateInput,
        },

    ]).then(function (answer) {
        connection.query(
            "INSERT INTO department SET ?;",
            {
                name: answer.name,
            },
            function (err, res) {
                if (err) throw err;
                console.log("The " + answer.name + " Department has been added");
                console.log("----------------------------------------------");
                init();
            }
        );
    });
}


// =======================================================================================
// Delete a Department
// =======================================================================================
function deleteDept() {
    getFunctions.getDepartments(function (result) {
        let deptToDelete = result;
        inquirer
            .prompt([
                {
                    name: "departmentName",
                    type: "list",
                    message: "Select Department to remove",
                    choices: deptToDelete,
                },
            ])
            .then(function (answers) {
                connection.query(
                    "DELETE FROM department WHERE ?;",
                    {name: answers.departmentName},
                    function (err, res) {
                        if (err) throw err;
                        console.log(
                            "The " + answers.departmentName + " Department has been removed"
                        );
                        console.log("----------------------------------------------");
                        init();
                    }
                );
            });
    });
}


// =======================================================================================
// Roles
// =======================================================================================
function roles() {
    // ask what they want to do
    inquirer.prompt(
        {
            type: "list",
            name: "roleChoice",
            message: "What would you like to do in Roles?",
            choices: [
                {
                    name: "View all Roles.",
                    value: "viewRoles"
                },
                {
                    name: "Add a Role.",
                    value: "addRole"
                },
                {
                    name: "Delete a Role.",
                    value: "deleteRole"
                },
            ]
        }
    ).then(answer => {
        switch (answer.roleChoice) {
            case "viewRoles":
                viewAllRoles();
                break;
            case "addRole":
                addRole();
                break;
            case "deleteRole":
                deleteRole();
                break;
        }
    })

}

// =======================================================================================
// View all Roles
// =======================================================================================

function viewAllRoles() {
    connection.query(
            `
                SELECT role.id, role.title, role.salary, department.name
                FROM role
                         INNER JOIN department ON role.department_id = department.id;`,
        function (err, res) {
            if (err) throw err;
            console.table(res);
            inquirer.prompt(
                {
                    type: "list",
                    name: "afterView",
                    message: "What would you like to do?",
                    choices: [
                        {
                            name: "Go Back to Roles page.",
                            value: "backRoles"
                        },
                        {
                            name: "Go Back to Main Page.",
                            value: "backMain"
                        },
                        {
                            name: "Exit Program",
                            value: "exit"
                        }
                    ]
                }
            ).then(choice => {
                switch (choice.afterView) {
                    case "backRoles":
                        roles();
                        break;
                    case "backMain":
                        init();
                        break;
                    default:
                        connection.end();
                        return;
                }
            })
        })
}

// =======================================================================================
// Add a Role
// =======================================================================================


function addRole() {
    getFunctions.getDepartments(function (result) {
        let departmentNames = result;
        console.table(departmentNames);
        inquirer.prompt([
            {
                type: "input",
                message: "What is the Title of your New Role?",
                name: "newRoleTitle",
                validate: validateInput
            }
        ]).then(answerOne => {
            inquirer.prompt([
                {
                    type: "input",
                    message: "What is the Salary of the New Role?",
                    name: "newRoleSalary",
                    validate: validateNumber
                }
            ]).then(answerTwo => {
                inquirer.prompt([
                    {
                        type: "list",
                        message: "Which department is the new role a part of?",
                        name: "newRoleDept",
                        choices: departmentNames
                    }
                ]).then(answerThree => {
                    connection.query(
                        "SELECT id FROM department WHERE ?",
                        {name: answerThree.newRoleDept},
                        function (err, department) {
                            if (err) throw err;
                            connection.query("INSERT INTO role SET ?", {
                                    title: answerOne.newRoleTitle,
                                    salary: answerTwo.newRoleSalary,
                                    department_id: department.id
                                }, (err, response) => {
                                    if (err) throw err;
                                    console.log(response);
                                    console.log("AnswerThree : " + answerThree.newRoleDept);
                                    console.log(
                                        "The role of " +
                                        answerOne.newRoleTitle +
                                        " with a salary of $" +
                                        answerTwo.newRoleSalary +
                                        " has been added to the " +
                                        answerThree.newRoleDept +
                                        " Department"
                                    );
                                    console.log("----------------------------------------------");
                                    init();
                                }
                            );
                        }
                    );
                });
            });
        })
    })
}

// =======================================================================================
// Delete a Role
// =======================================================================================

function deleteRole() {
    getFunctions.getRoles(function (result) {
        let rolesList = result;
        inquirer
            .prompt([
                {
                    name: "roleTitle",
                    type: "list",
                    message: "Select ROLE to Remove",
                    choices: rolesList,
                },
            ])
            .then(function (answers) {
                console.table(rolesList);
                connection.query(
                    "DELETE FROM role WHERE ?;",
                    {title: answers.roleTitle},
                    function (err, res) {
                        console.table(res);
                        if (err) throw err;
                        console.log(
                            "The role of " + answers.roleTitle + " has been removed"
                        );
                        console.log("----------------------------------------------");
                        init();
                    }
                );
            });
    });
}

// =======================================================================================
// Employees
// =======================================================================================
function employees() {
    inquirer.prompt(
        {
            type: "list",
            name: "employeeChoice",
            message: "What would you like to do in employees?",
            choices: [
                {
                    name: "Add an employee.",
                    value: "addEmp"
                },
                {
                    name: "View All Employees",
                    value: "viewAllEmp"
                },
                {
                    name: "View All Employees By Department ",
                    value: "viewEmpByDept"
                },
                {
                    name: "View All Employees By Role ",
                    value: "viewEmpByRole"
                },
                {
                    name: "View All Employees By Manager ",
                    value: "viewEmpByMngr"
                },
                {
                    name: "Update Employee Role ",
                    value: "updateEmpRole"
                },
                {
                    name: "Update Employee Manager ",
                    value: "updateEmpMngr"
                },
                {
                    name: "Delete Employee ",
                    value: "delEmp"
                }
            ]
        }
    ).then(answer => {
        switch (answer.employeeChoice) {
            case "addEmp":
                addEmployee();
            case "viewAllEmp":
                viewAllEmployees();
            case "viewEmpByDept":
                viewAllEmployeesByDept();
            case "viewEmpByRole":
                viewAllEmployeesByRole();
            case "viewEmpByMngr":
                viewAllEmployeesByMngr();
            case "updateEmpRole":
                updateEmployeeRole();
            case "updateEmpMngr":
                updateEmployeeByMngr();
            case "delEmp":
                deleteEmployee();
                break;
        }
    })
    // view, edit, or add departments
}


// =======================================================================================
// Add Employee
// =======================================================================================

function addEmployee() {
    getFunctions.getRoles(function (result) {
        let rolesList = result;
        getFunctions.getManagers(function (result) {
            let managersList = result;
            inquirer
                .prompt([
                    {
                        name: "firstName",
                        type: "input",
                        message: "enter the new employee's FIRST NAME",
                       // validate: validateInput,
                    },
                    {
                        name: "lastName",
                        type: "input",
                        message: "enter the new employee's LAST NAME",
                      //  validate: validateInput,
                    },
                    {
                        name: "role",
                        type: "list",
                        message: "select the new employee's ROLE",
                        choices: rolesList,
                    },
                    {
                        name: "manager",
                        type: "list",
                        message: "select the new employee's MANAGER",
                        choices: managersList,
                    },
                ])
                .then(function (answers) {
                    connection.query(
                        "SELECT id FROM role WHERE ?",
                        { title: answers.role },
                        function (err, roleId) {
                            if (err) throw err;
                            let managerFirstName = answers.manager
                                .split(" ")
                                .slice(0, -1)
                                .join(" ");
                            let managerLastName = answers.manager
                                .split(" ")
                                .slice(-1)
                                .join(" ");
                            connection.query(
                                "SELECT id FROM employee WHERE ? AND ?",
                                [
                                    { first_name: managerFirstName },
                                    { last_name: managerLastName },
                                ],
                                function (err, managerId) {
                                    if (err) throw err;
                                    connection.query(
                                        `INSERT INTO employee (first_name, last_name, role_id, manager_id) 
                        VALUES ("${answers.firstName}", "${answers.lastName}", ${roleId[0].id}, ${managerId[0].id});`,
                                        function (err, res) {
                                            console.log(res);
                                            if (err) throw err;
                                            console.log(
                                                answers.firstName +
                                                " " +
                                                answers.lastName +
                                                " officially works as a(n) " +
                                                answers.role
                                            );
                                            console.log(
                                                "----------------------------------------------"
                                            );
                                            init();
                                        }
                                    );
                                }
                            );
                        }
                    );
                });
        });
    });
}


// =======================================================================================
// View All Employees
// =======================================================================================

function viewAllEmployees() {
    connection.query("SELECT * FROM employee", function (err, res) {
        if (err) throw err
        console.table(res)
        inquirer.prompt(
            {
                type: "list",
                name: "afterView",
                message: "What would you like to do?",
                choices: [
                    {
                        name: "Go Back to Employees Page",
                        value: "backEmp"
                    },
                    {
                        name: "Go Back to Main Page",
                        value: "main"
                    },
                    {
                        name: "Exit program",
                        value: "exit"
                    }
                ]
            }
        ).then(choice => {
            switch (choice.afterView) {
                case "backEmp":
                    employees();
                    break;
                case "main":
                    init();
                    break;
                default:
                    connection.end();
                    return;
            }
        });
    });
}


// =======================================================================================
// View Employees By Department
// =======================================================================================

function viewAllEmployeesByDept() {
    getFunctions.getDepartments(function (result) {
        let departmentNames = result;
        inquirer
            .prompt([
                {
                    name: "deptName",
                    type: "list",
                    message: "select DEPARTMENT to view all employees",
                    choices: departmentNames,
                },
            ])
            .then(function (answers) {
                viewRelation.employeesByDepartment(answers.deptName, function (
                    result
                ) {
                    console.log(
                        "all employees in the " + answers.deptName + " Department:\n"
                    );
                   // console.table(result);
                    console.log("-----------------------------------------------------------------------");
                    init();
                });
            });
    });

}

// =======================================================================================
// View Employees By Role
// =======================================================================================

function viewAllEmployeesByRole() {
    getFunctions.getRoles(function (result) {
        let roleNames = result;
        inquirer
            .prompt([
                {
                    name: "roleName",
                    type: "list",
                    message: "select the ROLE to view all employees",
                    choices: roleNames,
                },
            ])
            .then(function (answers) {
                viewRelation.employeesByRole(answers.roleName, function (result) {
                    console.log(
                        "all employees working as a(n) " + answers.roleName + ":\n"
                    );
                    console.table(result);
                    console.log("------------------------------------------------------------");
                    init();
                });
            });
    });

}

// =======================================================================================
// View Employees By Manager
// =======================================================================================

function viewAllEmployeesByMngr() {
    getFunctions.getManagers(function (result) {
        const managersList = result;
        inquirer
            .prompt([
                {
                    name: "manager",
                    type: "list",
                    message: "select a MANAGER to view employees working under them",
                    choices: managersList,
                },
            ])
            .then(function (answers) {
                viewRelation.managersSubordinates(answers.manager, function (result) {
                    console.log("all employees working under " + answers.manager + ":\n");
                    console.table(result);
                    console.log("----------------------------------------------");
                    init();
                });
            });
    });

}

// =======================================================================================
// Update Employee Role
// =======================================================================================

function updateEmployeeRole() {
    getFunctions.getEmployees(function (result1) {
        let employeesList = result1;
        getFunctions.getRoles(function (result2) {
            let rolesList = result2;
            inquirer
                .prompt([
                    {
                        name: "name",
                        type: "list",
                        message: "select EMPLOYEE to change role of",
                        choices: employeesList,
                    },
                    {
                        name: "title",
                        type: "list",
                        message: "select the employee's NEW ROLE",
                        choices: rolesList,
                    },
                ])
                .then(function (answers) {
                    let firstName = answers.name.split(" ").slice(0, -1).join(" ");
                    let lastName = answers.name.split(" ").slice(-1).join(" ");
                    connection.query(
                        "SELECT id FROM role WHERE ?",
                        {title: answers.title},
                        function (err, res) {
                            if (err) throw err;
                            connection.query(
                                "UPDATE employee SET ? WHERE ? AND ?;",
                                [
                                    {role_id: res[0].id},
                                    {first_name: firstName},
                                    {last_name: lastName},
                                ],
                                function (err, res) {
                                    console.table(res);
                                   if (err) throw err;
                                    console.log(
                                        answers.name +
                                        "'s role successfully updated to " +
                                        answers.title
                                    );
                                    console.log("----------------------------------------------");
                                    init();
                                }
                            );
                        }
                    );
                });
        });
    });
}


// =======================================================================================
// Update Employee Manager
// =======================================================================================

function updateEmployeeByMngr() {
    getFunctions.getEmployees(function (result) {
        let employeesList = result;
        getFunctions.getManagers(function (result) {
            let managersList = result;
            inquirer
                .prompt([
                    {
                        name: "employee",
                        type: "list",
                        message: "select EMPLOYEE that is changing managers",
                        choices: employeesList,
                    },
                    {
                        name: "manager",
                        type: "list",
                        message: "select the employee's NEW MANAGER",
                        choices: managersList,
                    },
                ])
                .then(function (answers) {
                    var managerFirstName = answers.manager
                        .split(" ")
                        .slice(0, -1)
                        .join(" ");
                    var managerLastName = answers.manager.split(" ").slice(-1).join(" ");
                    var employeeFirstName = answers.employee
                        .split(" ")
                        .slice(0, -1)
                        .join(" ");
                    var employeeLastName = answers.employee
                        .split(" ")
                        .slice(-1)
                        .join(" ");
                    connection.query(
                        "SELECT id FROM employee WHERE ? AND ?;",
                        [{first_name: managerFirstName}, {last_name: managerLastName}],
                        function (err, res) {
                            if (err) throw err;
                            connection.query(
                                "UPDATE employee SET ? WHERE ? AND ?;",
                                [
                                    {manager_id: res[0].id},
                                    {first_name: employeeFirstName},
                                    {last_name: employeeLastName},
                                ],
                                function (err, res) {
                                    if (err) throw err;
                                    console.log(
                                        answers.employee +
                                        "'s manager has been updated to " +
                                        answers.manager
                                    );
                                    console.log("----------------------------------------------");
                                    init();
                                }
                            );
                        }
                    );
                });
        });
    });
}


// =======================================================================================
// Delete Employee
// =======================================================================================

function deleteEmployee() {
    getFunctions.getEmployees(function (result) {
        var employeesList = result;
        inquirer
            .prompt([
                {
                    name: "employeeName",
                    type: "list",
                    message: "select EMPLOYEE to remove",
                    choices: employeesList,
                },
            ])
            .then(function (answers) {
                let employeeFirstName = answers.employeeName
                    .split(" ")
                    .slice(0, -1)
                    .join(" ");
                let employeeLastName = answers.employeeName
                    .split(" ")
                    .slice(-1)
                    .join(" ");
                connection.query(
                    "DELETE FROM employee WHERE ? AND ?;",
                    [{first_name: employeeFirstName}, {last_name: employeeLastName}],
                    function (err, res) {
                        if (err) throw err;
                        console.log(answers.employeeName + " has been removed");
                        console.log("----------------------------------------------");
                        init();
                    }
                );
            });
    });
}