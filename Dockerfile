FROM amazon/aws-lambda-nodejs:16 AS connect

ARG FUNCTION_DIR="/var/task"

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

CMD ["build/connect.handler"]

# 

FROM amazon/aws-lambda-nodejs:16 AS disconnect

ARG FUNCTION_DIR="/var/task"

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

CMD ["build/disconnect.handler"]

#

FROM amazon/aws-lambda-nodejs:16 AS sendvendor

ARG FUNCTION_DIR="/var/task"

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

CMD ["build/send-vendor.handler"]

# 

FROM amazon/aws-lambda-nodejs:16 AS getvendors

ARG FUNCTION_DIR="/var/task"

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

CMD ["build/get-vendors.handler"]
