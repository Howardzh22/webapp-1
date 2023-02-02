CREATE DATABASE accounts_app;
USE accounts_app;

CREATE TABLE accounts(
id integer PRIMARY KEY AUTO_INCREMENT,
Email_Address VARCHAR(255) NOT NULL,
account_password VARCHAR(255) NOT NULL,
First_Name VARCHAR(20) NOT NULL,
Last_Name VARCHAR(20) NOT NULL,
account_created TIMESTAMP NOT NULL DEFAULT NOW(),
account_updated TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW()
);

INSERT INTO accounts(Email_Address,account_password,First_Name,Last_Name)
VALUES
('1@test.com', 'a1test','Lebron','James'),
('Second Note','b2test','Keven','Durant');

