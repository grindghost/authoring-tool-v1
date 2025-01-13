import { defineStore, createPinia, setActivePinia ,acceptHMRUpdate } from 'pinia';

const pinia = createPinia()
export default { store: setActivePinia(pinia) }

export const useProjects = defineStore('projects', {
  state: () => ({
    projects: [],
    currentProject: null,
    projectsLoaded: false,
    isLoading: false,
    statusMessage: 'Loading',
  }),

  actions: {
    startLoading() {
      this.statusMessage = 'Loading';
      this.isLoading = true;
    },
    stopLoading() {
      this.isLoading = false;
    },

    async fetchProjects(userId) {

      this.startLoading();

      // Reset projects loaded
      this.projectsLoaded = false;

      try {
        if (userId) {
          const response = await $fetch('/api/pb/projects', {
            headers: { UserId: userId },
          });
          this.projects = response;

          console.log('Fetched projects:', this.projects);

          // Optional: persist in localStorage if necessary
          // localStorage.setItem('projects', JSON.stringify(this.projects));

          // Flag projects as loaded
          this.projectsLoaded = true;

          this.stopLoading();

        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        this.stopLoading();
      }
    },


    async deleteProject(userId, projectId) {
      this.startLoading();
      this.statusMessage = 'Supression du projet';
      try {
        if (userId) {
          const response = await fetch(`/api/pb/delete-project/${projectId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              UserId: userId,
            },
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete project');
          }

          // Remove deleted project from local state
          this.projects = this.projects.filter((project) => project.id !== projectId);
        }
      } catch (error) {
        console.error('Error deleting project:', error.message);
        throw error;
      } finally {
        this.stopLoading();
      }
    },

    async saveProject(userId, id, profile) {
      this.startLoading();
      
      this.statusMessage = 'Sauvegarde';
      
      try {
        if (userId) {
          const response = await $fetch(`/api/pb/update-project/${id}`, {
            method: 'PUT',
            body: { profile },
            headers: { UserId: userId },
          });

          // Update project in state
          const projectIndex = this.projects.findIndex((p) => p.id === id);
          if (projectIndex >= 0) {
            this.projects[projectIndex].profile = profile;
          } else {
            this.projects.push({ id, profile });
          }

          // Optional: persist updated projects in localStorage
          // localStorage.setItem('projects', JSON.stringify(this.projects));
        }
      } catch (error) {
        console.error('Failed to save project:', error);
      }
      this.stopLoading();
    },

    async downloadProjectZip(activities, projectId, lang) {
      this.startLoading();
      try {
        const response = await fetch(`/api/pb/download-zip`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ projectId, activities, lang }),
        });
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        // Trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectId}.zip`;
        a.click();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Failed to download ZIP:', error);
      } finally {
        this.stopLoading();
      }
    },

    async createProject(userId, projectName, projectDescription, pdfFile, pdfImage) {
      this.startLoading();
      this.statusMessage = 'Création du projet';
      try {
        if (userId) {
          const formData = new FormData();
          formData.append('projectName', projectName);
          formData.append('projectDescription', projectDescription);
          formData.append('pdfFile', pdfFile);

          const pdfImageBlob = await fetch(pdfImage).then((res) => res.blob());
          formData.append('pdfImage', pdfImageBlob, 'cover_image.png');

          // Stringify the user
            //   const userJson = JSON.stringify({
            //     id: this.user.id,
            //     email: this.user.email,
            //     firstName: this.user.firstName,
            //     lastName: this.user.lastName,
            //   });

          const response = await fetch('/api/pb/create-project', {
            method: 'POST',
            headers: {
              UserId: userId,
            },
            body: formData,
          });
          const data = await response.json();

          if (data.success) {
            this.projects.push(data.project);
            return data.projectId;
          } else {
            throw new Error(data.message || 'Project creation failed');
          }
        }
      } catch (error) {
        console.error('Failed to create project:', error);
      } finally {
        this.stopLoading();
      }
    },

    async updateProjectFiles(projectId, pdfFile, pdfImage) {
      this.startLoading();
      this.statusMessage = 'Mise à jour des fichiers du projet';
      try {
        const formData = new FormData();
        formData.append('projectId', projectId);
        formData.append('pdfFile', pdfFile);
    
        if (pdfImage) {
          const pdfImageBlob = await fetch(pdfImage).then((res) => res.blob());
          formData.append('pdfImage', pdfImageBlob, 'cover_image.png');
        }
    
        const response = await fetch('/api/update-project-files', {
          method: 'POST',
          body: formData,
        });
    
        const data = await response.json();
    
        if (data.success) {
          const updatedProject = this.projects.find((p) => p.id === projectId);
          if (updatedProject) {
            updatedProject.profile.pdfURL = data.pdfFileUrl;
            updatedProject.profile.pdfCoverImgUrl = data.coverImageUrl;
          }
          return true;
        } else {
          throw new Error(data.message || 'Failed to update project files');
        }
      } catch (error) {
        console.error('Failed to update project files:', error);
        return false;
      } finally {
        this.stopLoading();
      }
    },
    

  },
});

// make sure to pass the right store definition, `useProjects` in this case.
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProjects, import.meta.hot))
}