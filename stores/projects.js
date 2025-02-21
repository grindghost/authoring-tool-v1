import { defineStore } from 'pinia';

export const useProjects = defineStore('projects', {
  state: () => ({
    projects: [],
    configs: null,
    locales: [],
    currentProject: null,
    projectsLoaded: false,
    isLoading: false,
    projectIsBeingCreated: false,
    selectedFile: null,
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


    async fetchProjects() {

        // Display loading
        this.startLoading();

        // Reset projects loaded
        this.projectsLoaded = false;

        try {
            // Send the request without passing the userId explicitly
            const response = await $fetch('/api/pb/projects', {
                credentials: 'include',
            });
            
            this.projects = response.projects;
            this.configs = response.configs;
            this.locales = response.locales;

            // Flag projects as loaded
            this.projectsLoaded = true;

            // Hide loading
            this.stopLoading();

        } catch (error) {
            console.error('Error fetching projects:', error);
            throw error;
        } finally {
            
            // Hide loading
            this.stopLoading();
        }
    },

    async deleteProject(projectId) {
      
      this.startLoading();
      
      this.statusMessage = 'Supression du projet';
      
      try {
        // Send the request without passing the userId explicitly
        const response = await fetch(`/api/pb/delete-project/${projectId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete project');
          }

          // Remove deleted project from local state
          this.projects = this.projects.filter((project) => project.id !== projectId);
        
      } catch (error) {
        console.error('Error deleting project:', error.message);
        throw error;
      } finally {
        this.stopLoading();
      }
    },

    async saveProject(projectId, profile) {
      
      this.startLoading();
      
      this.statusMessage = 'Sauvegarde';
      
      try {
        // Send the request without passing the userId explicitly
        const response = await $fetch(`/api/pb/update-project/${projectId}`, {
            method: 'PUT',
            body: { profile },
        });


          // Update projects state
          const projectIndex = this.projects.findIndex((p) => p.id === projectId);
          if (projectIndex >= 0) {
            this.projects[projectIndex].profile = profile;
          } else {
            this.projects.push({ projectId, profile });
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

        // Trigger the download on the client
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

    async createProject(projectName, projectDescription, pdfFile, pdfImage) {
              
      // this.startLoading();
      this.projectIsBeingCreated = true;
      
      this.statusMessage = 'Création du projet';
      
      try {

          const formData = new FormData();
          formData.append('projectName', projectName);
          formData.append('projectDescription', projectDescription);
          formData.append('pdfFile', pdfFile);

          const pdfImageBlob = await fetch(pdfImage).then((res) => res.blob());
          formData.append('pdfImage', pdfImageBlob, 'cover_image.png');

          const response = await fetch('/api/pb/create-project', {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();

          if (data.success) {
            
            // Refetch the projects
            await this.fetchProjects();

            return data.projectId;
          } else {
            throw new Error(data.message || 'Project creation failed');
          }
      } catch (error) {
        console.error('Failed to create project:', error);
      } finally {
        // this.stopLoading();
        this.projectIsBeingCreated = false;
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
    
        const response = await fetch('/api/pb/update-project-files', {
          method: 'POST',
          body: formData,
        });
    
        const data = await response.json();
    
        if (data.success) {
        //   const updatedProject = this.projects.find((p) => p.id === projectId);
        //   if (updatedProject) {
        //     updatedProject.profile.pdfURL = data.pdfFileUrl;
        //     updatedProject.profile.pdfCoverImgUrl = data.coverImageUrl;
        //   }
          await this.fetchProjects();
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
