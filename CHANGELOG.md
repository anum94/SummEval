# Changelog
### 1. Added Pagination for Full Text Records
#### Problem
- Loading times were slow for large files in project overview page.
- Runtime errors occurred for files >200MB.

#### Solution
- Added pagination to the backend using `PageNumberPagination`.
- Each page loads 10 full texts and their reference summary at a time.

#### Performance Improvements
- Before: 112MB file took ~1 minute, 200MB failed.
- After: All files load in <1 second when no experiments created.

#### User Experience
- Pagination controls and search functionality for full text overview were added to the frontend.

### 2. Subset Uploading and Summary Generation
#### Problem
- Users needed to upload full-text datasets with exact numbers, limiting flexibility.
- Handling large full-text uploads reduced scalability.

#### Solution
- Enabled users to upload subsets from full-text data by:
  - Uploading user-provided summaries.
  - Generating summaries using selected models.
  - Allowing selection of fixed subset groups or customized indices corresponding to the full-text indices.
- Increased scalability by removing the requirement to match the exact number of full-text records during experiment creation.

#### User Impact
- Simplifies handling large datasets.
- Allows users to work with flexible subsets without requiring entire full-text uploads.

---

### 3. Pagination for Experiments
#### Problem
- Fetching all summaries for an experiment at once caused long load times for experiments with large numbers of records.
- Loading the experiment detail page became inefficient for large datasets.

#### Solution
- Implemented pagination for summaries in experiments.
- Each page loads only 10 records at a time.

#### Performance Improvements
- **Before**: Entire summary set fetched in one call, causing delays for large experiments.
- **After**: Summaries load in small, manageable chunks, significantly improving performance.

---

### 4. Enhanced Response with Attached References
#### Problem
- Fetching current experiment summaries required additional database searches to retrieve linked reference summaries and full-text records, causing delays.

#### Solution
- Enhanced the backend response to include:
  - Attached reference summaries.
  - Linked full-text data.
- Eliminated the need for separate database queries, reducing load times.

#### User Impact
- Faster loading of experiment detail pages.
- Improved responsiveness when accessing current experiment summaries.

---

### 5. Static Check for Linked Summaries
#### Problem
- Linked summaries from other experiments were displayed even when indices did not match the current summary.
- Static checks were insufficient for dynamic scenarios where linked summaries might exist on different pages.

#### Solution
- Added a static check:
  - Summaries from other experiments are only displayed if their indices match the current summary's index on the same page.
- Planned future enhancement:
  - Implement dynamic linking of summaries across different pages for accurate matching.

#### User Impact
- Improved accuracy of linked summary displays.
- Provides a foundation for dynamic linking to be introduced later.

---

## Further Improvements

### 1. Paginated Assessment Metrics Fetching
#### Problem
- Individual assessments for each summary (uploaded and generated) are fetched all at once, leading to performance bottlenecks for experiments with large numbers of summaries.

#### Solution
- Introduced pagination for assessment metrics:
  - Metrics for only the summaries currently being viewed will be fetched.
  - Reduces the load on the backend and improves responsiveness.

#### User Impact
- Faster loading times for experiment detail pages.
- Improved scalability when dealing with large datasets.

---

### 2. Caching Links Between Summaries
#### Problem
- Linked summaries from other experiments are fetched every time a page or index tab changes, causing redundant API calls and performance degradation.

#### Solution
- Implemented caching for links between current experiment summaries and other experiment summaries:
  - Once fetched, the links are cached to avoid repetitive API calls.
  - The cache is updated only when necessary, such as when new summaries are added or indices are updated.

#### User Impact
- Reduces unnecessary API calls when navigating between pages or switching index tabs.
- Improves responsiveness and overall user experience.

