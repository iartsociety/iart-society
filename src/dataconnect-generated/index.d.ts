import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface AccessCode_Key {
  id: UUIDString;
  __typename?: 'AccessCode_Key';
}

export interface Course_Key {
  id: UUIDString;
  __typename?: 'Course_Key';
}

export interface CreateCourseData {
  course_insert: Course_Key;
}

export interface CreateCourseVariables {
  title: string;
  description: string;
  instructorName: string;
}

export interface EnrollUserInCourseData {
  enrollment_insert: Enrollment_Key;
}

export interface EnrollUserInCourseVariables {
  courseId: UUIDString;
}

export interface Enrollment_Key {
  id: UUIDString;
  __typename?: 'Enrollment_Key';
}

export interface GetCourseStepsData {
  steps: ({
    title: string;
    content: string;
    sequenceOrder: number;
  })[];
}

export interface GetCourseStepsVariables {
  courseId: UUIDString;
}

export interface ListMyCoursesData {
  enrollments: ({
    course: {
      title: string;
      instructorName: string;
    };
    progressStatus: string;
  })[];
}

export interface Step_Key {
  id: UUIDString;
  __typename?: 'Step_Key';
}

export interface UserProgress_Key {
  id: UUIDString;
  __typename?: 'UserProgress_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateCourseRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateCourseVariables): MutationRef<CreateCourseData, CreateCourseVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateCourseVariables): MutationRef<CreateCourseData, CreateCourseVariables>;
  operationName: string;
}
export const createCourseRef: CreateCourseRef;

export function createCourse(vars: CreateCourseVariables): MutationPromise<CreateCourseData, CreateCourseVariables>;
export function createCourse(dc: DataConnect, vars: CreateCourseVariables): MutationPromise<CreateCourseData, CreateCourseVariables>;

interface EnrollUserInCourseRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: EnrollUserInCourseVariables): MutationRef<EnrollUserInCourseData, EnrollUserInCourseVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: EnrollUserInCourseVariables): MutationRef<EnrollUserInCourseData, EnrollUserInCourseVariables>;
  operationName: string;
}
export const enrollUserInCourseRef: EnrollUserInCourseRef;

export function enrollUserInCourse(vars: EnrollUserInCourseVariables): MutationPromise<EnrollUserInCourseData, EnrollUserInCourseVariables>;
export function enrollUserInCourse(dc: DataConnect, vars: EnrollUserInCourseVariables): MutationPromise<EnrollUserInCourseData, EnrollUserInCourseVariables>;

interface ListMyCoursesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListMyCoursesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListMyCoursesData, undefined>;
  operationName: string;
}
export const listMyCoursesRef: ListMyCoursesRef;

export function listMyCourses(options?: ExecuteQueryOptions): QueryPromise<ListMyCoursesData, undefined>;
export function listMyCourses(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListMyCoursesData, undefined>;

interface GetCourseStepsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetCourseStepsVariables): QueryRef<GetCourseStepsData, GetCourseStepsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetCourseStepsVariables): QueryRef<GetCourseStepsData, GetCourseStepsVariables>;
  operationName: string;
}
export const getCourseStepsRef: GetCourseStepsRef;

export function getCourseSteps(vars: GetCourseStepsVariables, options?: ExecuteQueryOptions): QueryPromise<GetCourseStepsData, GetCourseStepsVariables>;
export function getCourseSteps(dc: DataConnect, vars: GetCourseStepsVariables, options?: ExecuteQueryOptions): QueryPromise<GetCourseStepsData, GetCourseStepsVariables>;

