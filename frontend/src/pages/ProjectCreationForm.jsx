import {Box, Button, TextField, Typography} from '@mui/material';
import {Formik} from 'formik';
import * as yup from 'yup';
import useMediaQuery from '@mui/material/useMediaQuery';
import Topbar from "../components/Global/Topbar";

const initialValues = {
    projectName: '',
    projectDescription: '',
    projectFulltext: '',
    projectReferenceSummary: '',
};

const validationSchema = yup.object().shape({
  projectName: yup.string().required("Project name is required"),
  projectDescription: yup.string().required("Project description is required"),
  projectFulltext: yup.string().required("Project fulltext is required"),
  projectReferenceSummary: yup
    .string()
    .required("Project reference summary is required"),
});

const ProjectCreationForm = () => {
    const isNonMobile = useMediaQuery('(min-width:600px)');

    const handleSubmit = (values) => {
        console.log(values);
    }

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
            }}
        >
            
            <Typography
                variant={isNonMobile ? 'h4' : 'h5'}
                sx={{
                    marginBottom: '16px',
                }}
            >
                Create a new Project
            </Typography>
            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
            >
                {({
                    values,
                    errors,
                    touched,
                    handleChange,
                    handleBlur,
                    handleSubmit,
                }) => (
                    <form onSubmit={handleSubmit}>
                        <Box
                            sx={{
                                display: 'grid',
                                gap: '16px',
                                width: '100%',
                                padding: '16px',
                                backgroundColor: 'primaryBackground[200]',
                                borderRadius: '4px',
                                boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
                            }}
                        >
                        <TextField
                            name="projectName"
                            label="Project Name"
                            variant="outlined"
                            fullWidth
                            value={values.projectName}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={touched.projectName && Boolean(errors.projectName)}
                            helperText={touched.projectName && errors.projectName}
                            sx={{gridColumn: {xs: 'span 2', sm: 'span 1'}}}
                        />
                        <TextField
                            name="projectDescription"
                            label="Project Description"
                            variant="outlined"
                            fullWidth
                            value={values.projectDescription}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={touched.projectDescription && Boolean(errors.projectDescription)}
                            helperText={touched.projectDescription && errors.projectDescription}
                            sx={{gridColumn: {xs: 'span 2', sm: 'span 1'}}}
                        />
                        <TextField
                            name="projectFulltext"
                            label="Project Fulltext"
                            variant="outlined"
                            fullWidth
                            value={values.projectFulltext}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={touched.projectFulltext && Boolean(errors.projectFulltext)}
                            helperText={touched.projectFulltext && errors.projectFulltext}
                            sx={{gridColumn: {xs: 'span 2', sm: 'span 1'}}}
                        />
                        <TextField
                            name="projectReferenceSummary"
                            label="Project Reference Summary"
                            variant="outlined"
                            fullWidth
                            value={values.projectReferenceSummary}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={touched.projectReferenceSummary && Boolean(errors.projectReferenceSummary)}
                            helperText={touched.projectReferenceSummary && errors.projectReferenceSummary}
                            sx={{gridColumn: {xs: 'span 2', sm: 'span 1'}}}
                        />
                        </Box>
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                marginTop: '16px',
                            }}
                        >
                        <Button
                            type="submit"
                            variant="contained"
                            color="secondary"
                        >
                            Create Project
                        </Button>
                        </Box>
                    </form>
                )}
            </Formik>
        </Box>
    )
};

export default ProjectCreationForm;
