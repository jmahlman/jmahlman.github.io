---
title: Enable SSL and FIPS in MySQL for use with Jamf Pro
date: 2024-07-19T10:30-05:00
author: john
excerpt: My organization is forced to use on-prem Jamf Pro for <a href=\"https://ideas.jamf.com/ideas/search?query=FedRAMP\"target=\"_blank\" rel=\"noopener\">reasons</a>.  This means that we're responsible for managing every aspect of the infrastructure and making sure it's all secure and meets our organization standards (which are driven by government mandates and audits). We need to ensure that all data in transit or at rest is encrypted and that FIPS mode is enabled in the database.  I asked Jamf for assistance on this and wasn't given anything useful via my normal support routes. It's frustrating that Jamf themselves does not have the experts to help with issues or questions anymore for us on-prem customers, but here we are. So I got this working, wrote it all down, and now want to share it with everyone who may need it.
categories: [Guides]
tags: [apple, jamf]
---
My organization is forced to use on-prem Jamf Pro for [reasons](https://ideas.jamf.com/ideas/search?query=FedRAMP).  This means that we're responsible for managing every aspect of the infrastructure and making sure it's all secure and meets our organization standards (which are driven by government mandates and audits). We need to ensure that **all data in transit or at rest is encrypted** and that **FIPS mode is enabled in the database.**  I asked Jamf for assistance on this and wasn't given anything useful via my normal support routes. It's frustrating that Jamf themselves does not have the experts to help with issues or questions anymore for us on-prem customers, but here we are. So I got this working, wrote it all down, and now want to share it with everyone who may need it.

## Preparations

Before staring any of this, take snapshots of your servers if you have that ability. Also, take a backup of your database. This should be standard practice, but I don't want you to follow this and forget to do those. 🙂

* Stop your Jamf Pro servers
* Verify openssl version on your database server with the `openssl version` command, it needs to be OpenSSL Version 1.0.1 or higher (which I sure hope it is)
* Verify MySQL is version 8.0.x: `mysql --version` (8.0.35 is current at time of documentation)
* Log into your MySQL database with root and verify that the database is capable of enabling SSL and FIPS by running the following command in MySQL: `show variables like "%ssl%";`. You should see something like the following output:

```sql
+---------------+------------+
| Variable_name | Value      |
+---------------+------------+
| have_openssl  | DISABLED   |
| have_ssl      | DISABLED   |
| ssl_ca        |            |
| ssl_capath    |            |
| ssl_cert      |            |
| ssl_cipher    |            |
| ssl_fips_mode | OFF        |
| ssl_key       |            |
+---------------+------------+
```

* Once all of this is validated, you can begin the process of generating certs and enabling items

## Generate CA and Certs

Now we're going to create the CA, server cert, and the client cert. I am sure there is a better way to do all of these commands, but this is what worked for me. I'm happy to take comments about my horrible commands.

* Create a directory to store the certs on your database server:

```bash
mkdir /data/mysql/new_certs
cd /data/mysql/new_certs
```

> It's important to use different Common Names for ALL of these. If you don't things will break! Read the common name comment in each section for direction, you can use whatever name you want, just make sure you know what it is!
{: .prompt-warning }

* Create the CA for your database server

```bash
#COMMON NAME: Production Database CA
openssl genrsa 2048 > ca-key.pem
openssl req -new -x509 -nodes -days 3600 -key ca-key.pem -out ca.pem
```

* Create server key and certificate with sha256 digest, sign it and convert the RSA key from PKCS #8 (OpenSSL 1.0 and newer) to the old PKCS #1 format

```bash
# COMMON NAME FOR PROD: database.server.fqd.com
openssl req -newkey rsa:2048 -days 3600 -nodes -keyout server-key.pem -out server-req.pem
openssl rsa -in server-key.pem -out server-key.pem
openssl x509 -req -in server-req.pem -days 3600 -CA ca.pem -CAkey ca-key.pem -set_serial 01 -out server-cert.pem
```

* Create client key and certificate the same way:

```bash
#COMMON NAME for PROD: your.jamf.server.fqdn.com
openssl req -newkey rsa:2048 -days 3600 -nodes -keyout client-key.pem -out client-req.pem
openssl rsa -in client-key.pem -out client-key.pem
openssl x509 -req -in client-req.pem -days 3600 -CA ca.pem -CAkey ca-key.pem -set_serial 01 -out client-cert.pem
```

* Update permissions on the files:

```bash
chmod -R 744 /data/mysql/new_certs
chown -R mysql:mysql /data/mysql/new_certs
```

## Update MySQL config

Now that we have the certs, we can make changes to the MySQL config file. We're going to enable FIPS mode with a single line, then we'll tell MySQL which certs to use for SSL and require SSL.

* Open my.cnf: `sudo nano /etc/my.cnf`
* Under the `[mysqld]` section, enable FIPS and SSL by adding the following:

```conf
ssl_fips_mode = ON
ssl-cipher=DHE-RSA-AES256-SHA
ssl-ca=/data/mysql/new_certs/ca.pem
ssl-cert=/data/mysql/new_certs/server-cert.pem
ssl-key=/data/mysql/new_certs/server-key.pem
require_secure_transport = ON
```
{: file='/etc/my.cnf'}

* Under `[client]` add the following lines to tell the MySQL server to allow these certs from the clients

```conf
ssl-ca=/data/mysql/new_certs/ca.pem
ssl-cert=/data/mysql/new_certs/client-cert.pem
ssl-key=/data/mysql/new_certs/client-key.pem
```
{: file='/etc/my.cnf'}

* Save and close the config file
* Restart MySQL and log into your MySQL root account and re-run `show variables like "%ssl%";`. You should see something like the following output if ssl and FIPS is enabled:

```sql
+---------------+-----------------------------------------+
| Variable_name | Value                                   |
+---------------+-----------------------------------------+
| have_openssl  | YES                                     |
| have_ssl      | YES                                     |
| ssl_ca        | /data/mysql/new_certs/ca.pem            |
| ssl_capath    |                                         |
| ssl_cert      | /data/mysql/new_certs/server-cert.pem   |
| ssl_cipher    | DHE-RSA-AES256-SHA                      |
| ssl_fips_mode | ON                                      |
| ssl_key       | /data/mysql/new_certs/server-key.pem    |
+---------------+-----------------------------------------+
```

> If you get errors logging into MySQL locally after making the SSL changes to my.cnf, the issue is most likely the certs. Make sure the CA has a different name from all other items created AND make sure that your CLIENT and SERVER certs use different names. 99% of the issues rest here. Examples of the errors: `ERROR 2026 (HY000): SSL connection error: SSL is required but the server doesn't support it` `SSL connection error: error:0A000086:SSL routines::certificate verify failed`
{: .prompt-tip }

### Grant permissions on the user

You will need to update your Jamf users to require SSL. If you know the users you have to update, you can skip to step 2.

* Show all users in the DB using `select user, host from mysql.user`.  The output should be similar to this:

```sql
+------------------+--------------------------+
| user             | host                     |
+------------------+--------------------------+
| jamfuser         | IP/FQDN of Jamf Server 1 |
| jamfuser         | IP/FQDN of Jamf Server 2 |
...              
| mysql.infoschema | localhost                |
| mysql.session    | localhost                |
| mysql.sys        | localhost                |
| root             | localhost                |
+------------------+--------------------------+
```

* Now, update the Jamf user(s) to require SSL:

```sql
ALTER USER jamfuser@<IP/FQDN of Jamf Server> REQUIRE SSL;
```

## Enable SSL on Jamf Pro

Now that MySQL is setup for SSL, we need to make sure that Jamf Pro can connect to the database using SSL. Once setup, this should remain in place after Jamf Pro upgrades. As usual, ensure you have backups.

### Add certs to the Java Keystore

* Send the `ca.pem` and the `client-cert.pem` that you created in "Generate CA and Certs" to the jamf servers however you need to (I use SCP). Put them in whatever directory you need, I used  `/opt/jss/mysql-certs/` and update the permissions:

```bash
mkdir /opt/jss/mysql-certs
chmod 744 /opt/jss/mysql-certs/
chmod -R 644 /opt/jss/mysql-certs/*.pem
chown -R jamftomcat:jamftomcat /opt/jss/mysql-certs/
```

* Then add the certs to the java keystore. You can use whatever names you want for the alias. You will need the keystore password to do this (remember the default password)

```bash
keytool -import -trustcacerts -file /opt/jss/mysql-certs/ca.pem -alias "Jamf Database CA" -keystore /etc/pki/java/cacerts
keytool -import -trustcacerts -file /opt/jss/mysql-certs/client-cert.pem -alias "Jamf Client Cert" -keystore /etc/pki/java/cacerts
```

### Update the Jamf database.xml file

Now, we need to tell tomcat to use SSL. This is pretty simple.

* Open the DataBase.xml file:

```bash
nano /usr/local/jss/tomcat/webapps/ROOT/WEB-INF/xml/DataBase.xml
```

* Edit the `<jdbcParameters>` line to look like this:

```xml
<jdbcParameters>?characterEncoding=utf8&amp;useUnicode=true&amp;jdbcCompliantTruncation=false&amp;useSSL=true&amp;requireSSL=true&amp;verifyServerCertificate=false</jdbcParameters>
```
{: file='../jss/tomcat/webapps/ROOT/WEB-INF/xml/DataBase.xml'}

> This is what you are adding to the default line: `&amp;useSSL=true&amp;requireSSL=true&amp;verifyServerCertificate=false`
{: .prompt-info}

* You can test your database connection using the jamf-pro binary: `jamf-pro database test-connection`
* Start your Jamf Pro server and it should connect if all went well!

## Validate that Jamf is using SSL

You can log into the database and run the following command after Jamf is started to validate that SSL is being used:

```sql
select t.THREAD_ID,
    t.PROCESSLIST_USER,
    t.PROCESSLIST_HOST,
    t.CONNECTION_TYPE,
    sbt.VARIABLE_VALUE AS cipher
FROM performance_schema.threads t
LEFT JOIN performance_schema.status_by_thread sbt
    ON (t.THREAD_ID = sbt.THREAD_ID AND sbt.VARIABLE_NAME = 'Ssl_cipher')
WHERE t.PROCESSLIST_USER IS NOT NULL;
```

You will get output similar to the following, note the connection type:

```sql
+-----------+------------------+---------------------------+-----------------+------------------------+
| THREAD_ID | PROCESSLIST_USER | PROCESSLIST_HOST          | CONNECTION_TYPE | cipher                 |
+-----------+------------------+---------------------------+-----------------+------------------------+
|        40 | event_scheduler  | localhost                 | NULL            | NULL                   |
|     58085 | jamfuser         | jamfpro.server.fqdn.com   | SSL/TLS         | TLS_AES_256_GCM_SHA384 |
|     58098 | root             | localhost                 | SSL/TLS         | TLS_AES_256_GCM_SHA384 |
|     58037 | jamfuser         | jamfpro.server.fqdn.com   | SSL/TLS         | TLS_AES_256_GCM_SHA384 |
|     58046 | jamfuser         | jamfpro.server.fqdn.com   | SSL/TLS         | TLS_AES_256_GCM_SHA384 |
|     58059 | jamfuser         | jamfpro.server.fqdn.com   | SSL/TLS         | TLS_AES_256_GCM_SHA384 |
|     58064 | jamfuser         | jamfpro.server.fqdn.com   | SSL/TLS         | TLS_AES_256_GCM_SHA384 |
+-----------+------------------+---------------------------+-----------------+------------------------+
```
