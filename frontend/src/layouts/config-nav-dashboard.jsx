import { paths } from 'src/routes/paths';
import { Iconify } from 'src/components/Iconify';


// Import the projects from the ProjectsProvider
export function getNavData(projects) {
  return [
    /**
     * Overview
     */
    {
      subheader: '',
      items: [
        {
          title: 'Dashboard',
          path: paths.dashboard.root,
          icon: <Iconify icon="heroicons:squares-2x2" />,
        },
      ],
    },
    ...projects
      .filter(
        (project) =>
          project.fields.invite_status === null || project.fields.invite_status === 'ACCEPTED'
      )
      .map((project) => ({
        subheader: project.fields.name,
        items: [
          {
            title: 'Overview',
            path: paths.project.root + '/' + project.pk.toString(),
            icon: <Iconify icon="fluent:data-usage-24-regular" />,
          },
          {
            title: 'Experiments',
            path: paths.project.root + '/' + project.pk.toString() + '/' + 'experiment' + '/',
            icon: <Iconify icon="material-symbols:science-outline" />,
            children: project.fields.experiments
              ? project.fields.experiments.map((experiment) => ({
                  title: experiment.name,
                  path:
                    paths.project.root +
                    '/' +
                    project.pk.toString() +
                    '/' +
                    'experiment' +
                    '/' +
                    experiment.pk.toString(),
                }))
              : [],
          },
        ],
      })),
  ];
}
