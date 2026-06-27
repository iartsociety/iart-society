# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListMyCourses*](#listmycourses)
  - [*GetCourseSteps*](#getcoursesteps)
- [**Mutations**](#mutations)
  - [*CreateCourse*](#createcourse)
  - [*EnrollUserInCourse*](#enrolluserincourse)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ListMyCourses
You can execute the `ListMyCourses` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listMyCourses(options?: ExecuteQueryOptions): QueryPromise<ListMyCoursesData, undefined>;

interface ListMyCoursesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListMyCoursesData, undefined>;
}
export const listMyCoursesRef: ListMyCoursesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listMyCourses(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListMyCoursesData, undefined>;

interface ListMyCoursesRef {
  ...
  (dc: DataConnect): QueryRef<ListMyCoursesData, undefined>;
}
export const listMyCoursesRef: ListMyCoursesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listMyCoursesRef:
```typescript
const name = listMyCoursesRef.operationName;
console.log(name);
```

### Variables
The `ListMyCourses` query has no variables.
### Return Type
Recall that executing the `ListMyCourses` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListMyCoursesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListMyCoursesData {
  enrollments: ({
    course: {
      title: string;
      instructorName: string;
    };
    progressStatus: string;
  })[];
}
```
### Using `ListMyCourses`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listMyCourses } from '@dataconnect/generated';


// Call the `listMyCourses()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listMyCourses();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listMyCourses(dataConnect);

console.log(data.enrollments);

// Or, you can use the `Promise` API.
listMyCourses().then((response) => {
  const data = response.data;
  console.log(data.enrollments);
});
```

### Using `ListMyCourses`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listMyCoursesRef } from '@dataconnect/generated';


// Call the `listMyCoursesRef()` function to get a reference to the query.
const ref = listMyCoursesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listMyCoursesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.enrollments);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.enrollments);
});
```

## GetCourseSteps
You can execute the `GetCourseSteps` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getCourseSteps(vars: GetCourseStepsVariables, options?: ExecuteQueryOptions): QueryPromise<GetCourseStepsData, GetCourseStepsVariables>;

interface GetCourseStepsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetCourseStepsVariables): QueryRef<GetCourseStepsData, GetCourseStepsVariables>;
}
export const getCourseStepsRef: GetCourseStepsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getCourseSteps(dc: DataConnect, vars: GetCourseStepsVariables, options?: ExecuteQueryOptions): QueryPromise<GetCourseStepsData, GetCourseStepsVariables>;

interface GetCourseStepsRef {
  ...
  (dc: DataConnect, vars: GetCourseStepsVariables): QueryRef<GetCourseStepsData, GetCourseStepsVariables>;
}
export const getCourseStepsRef: GetCourseStepsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getCourseStepsRef:
```typescript
const name = getCourseStepsRef.operationName;
console.log(name);
```

### Variables
The `GetCourseSteps` query requires an argument of type `GetCourseStepsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetCourseStepsVariables {
  courseId: UUIDString;
}
```
### Return Type
Recall that executing the `GetCourseSteps` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetCourseStepsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetCourseStepsData {
  steps: ({
    title: string;
    content: string;
    sequenceOrder: number;
  })[];
}
```
### Using `GetCourseSteps`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getCourseSteps, GetCourseStepsVariables } from '@dataconnect/generated';

// The `GetCourseSteps` query requires an argument of type `GetCourseStepsVariables`:
const getCourseStepsVars: GetCourseStepsVariables = {
  courseId: ..., 
};

// Call the `getCourseSteps()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getCourseSteps(getCourseStepsVars);
// Variables can be defined inline as well.
const { data } = await getCourseSteps({ courseId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getCourseSteps(dataConnect, getCourseStepsVars);

console.log(data.steps);

// Or, you can use the `Promise` API.
getCourseSteps(getCourseStepsVars).then((response) => {
  const data = response.data;
  console.log(data.steps);
});
```

### Using `GetCourseSteps`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getCourseStepsRef, GetCourseStepsVariables } from '@dataconnect/generated';

// The `GetCourseSteps` query requires an argument of type `GetCourseStepsVariables`:
const getCourseStepsVars: GetCourseStepsVariables = {
  courseId: ..., 
};

// Call the `getCourseStepsRef()` function to get a reference to the query.
const ref = getCourseStepsRef(getCourseStepsVars);
// Variables can be defined inline as well.
const ref = getCourseStepsRef({ courseId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getCourseStepsRef(dataConnect, getCourseStepsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.steps);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.steps);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateCourse
You can execute the `CreateCourse` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createCourse(vars: CreateCourseVariables): MutationPromise<CreateCourseData, CreateCourseVariables>;

interface CreateCourseRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateCourseVariables): MutationRef<CreateCourseData, CreateCourseVariables>;
}
export const createCourseRef: CreateCourseRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createCourse(dc: DataConnect, vars: CreateCourseVariables): MutationPromise<CreateCourseData, CreateCourseVariables>;

interface CreateCourseRef {
  ...
  (dc: DataConnect, vars: CreateCourseVariables): MutationRef<CreateCourseData, CreateCourseVariables>;
}
export const createCourseRef: CreateCourseRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createCourseRef:
```typescript
const name = createCourseRef.operationName;
console.log(name);
```

### Variables
The `CreateCourse` mutation requires an argument of type `CreateCourseVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateCourseVariables {
  title: string;
  description: string;
  instructorName: string;
}
```
### Return Type
Recall that executing the `CreateCourse` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateCourseData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateCourseData {
  course_insert: Course_Key;
}
```
### Using `CreateCourse`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createCourse, CreateCourseVariables } from '@dataconnect/generated';

// The `CreateCourse` mutation requires an argument of type `CreateCourseVariables`:
const createCourseVars: CreateCourseVariables = {
  title: ..., 
  description: ..., 
  instructorName: ..., 
};

// Call the `createCourse()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createCourse(createCourseVars);
// Variables can be defined inline as well.
const { data } = await createCourse({ title: ..., description: ..., instructorName: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createCourse(dataConnect, createCourseVars);

console.log(data.course_insert);

// Or, you can use the `Promise` API.
createCourse(createCourseVars).then((response) => {
  const data = response.data;
  console.log(data.course_insert);
});
```

### Using `CreateCourse`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createCourseRef, CreateCourseVariables } from '@dataconnect/generated';

// The `CreateCourse` mutation requires an argument of type `CreateCourseVariables`:
const createCourseVars: CreateCourseVariables = {
  title: ..., 
  description: ..., 
  instructorName: ..., 
};

// Call the `createCourseRef()` function to get a reference to the mutation.
const ref = createCourseRef(createCourseVars);
// Variables can be defined inline as well.
const ref = createCourseRef({ title: ..., description: ..., instructorName: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createCourseRef(dataConnect, createCourseVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.course_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.course_insert);
});
```

## EnrollUserInCourse
You can execute the `EnrollUserInCourse` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
enrollUserInCourse(vars: EnrollUserInCourseVariables): MutationPromise<EnrollUserInCourseData, EnrollUserInCourseVariables>;

interface EnrollUserInCourseRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: EnrollUserInCourseVariables): MutationRef<EnrollUserInCourseData, EnrollUserInCourseVariables>;
}
export const enrollUserInCourseRef: EnrollUserInCourseRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
enrollUserInCourse(dc: DataConnect, vars: EnrollUserInCourseVariables): MutationPromise<EnrollUserInCourseData, EnrollUserInCourseVariables>;

interface EnrollUserInCourseRef {
  ...
  (dc: DataConnect, vars: EnrollUserInCourseVariables): MutationRef<EnrollUserInCourseData, EnrollUserInCourseVariables>;
}
export const enrollUserInCourseRef: EnrollUserInCourseRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the enrollUserInCourseRef:
```typescript
const name = enrollUserInCourseRef.operationName;
console.log(name);
```

### Variables
The `EnrollUserInCourse` mutation requires an argument of type `EnrollUserInCourseVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface EnrollUserInCourseVariables {
  courseId: UUIDString;
}
```
### Return Type
Recall that executing the `EnrollUserInCourse` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `EnrollUserInCourseData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface EnrollUserInCourseData {
  enrollment_insert: Enrollment_Key;
}
```
### Using `EnrollUserInCourse`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, enrollUserInCourse, EnrollUserInCourseVariables } from '@dataconnect/generated';

// The `EnrollUserInCourse` mutation requires an argument of type `EnrollUserInCourseVariables`:
const enrollUserInCourseVars: EnrollUserInCourseVariables = {
  courseId: ..., 
};

// Call the `enrollUserInCourse()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await enrollUserInCourse(enrollUserInCourseVars);
// Variables can be defined inline as well.
const { data } = await enrollUserInCourse({ courseId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await enrollUserInCourse(dataConnect, enrollUserInCourseVars);

console.log(data.enrollment_insert);

// Or, you can use the `Promise` API.
enrollUserInCourse(enrollUserInCourseVars).then((response) => {
  const data = response.data;
  console.log(data.enrollment_insert);
});
```

### Using `EnrollUserInCourse`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, enrollUserInCourseRef, EnrollUserInCourseVariables } from '@dataconnect/generated';

// The `EnrollUserInCourse` mutation requires an argument of type `EnrollUserInCourseVariables`:
const enrollUserInCourseVars: EnrollUserInCourseVariables = {
  courseId: ..., 
};

// Call the `enrollUserInCourseRef()` function to get a reference to the mutation.
const ref = enrollUserInCourseRef(enrollUserInCourseVars);
// Variables can be defined inline as well.
const ref = enrollUserInCourseRef({ courseId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = enrollUserInCourseRef(dataConnect, enrollUserInCourseVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.enrollment_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.enrollment_insert);
});
```

