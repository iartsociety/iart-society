# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createCourse, enrollUserInCourse, listMyCourses, getCourseSteps } from '@dataconnect/generated';


// Operation CreateCourse:  For variables, look at type CreateCourseVars in ../index.d.ts
const { data } = await CreateCourse(dataConnect, createCourseVars);

// Operation EnrollUserInCourse:  For variables, look at type EnrollUserInCourseVars in ../index.d.ts
const { data } = await EnrollUserInCourse(dataConnect, enrollUserInCourseVars);

// Operation ListMyCourses: 
const { data } = await ListMyCourses(dataConnect);

// Operation GetCourseSteps:  For variables, look at type GetCourseStepsVars in ../index.d.ts
const { data } = await GetCourseSteps(dataConnect, getCourseStepsVars);


```