```dockerfile
# Stage 1: Builder - Install application dependencies
# We use a Node.js LTS (Long Term Support) image for stability.
# The 'slim' variant provides a balance between features and image size.
FROM node:lts-slim AS builder

# Set the working directory inside the container.
# All subsequent commands will run from this directory.
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) to leverage Docker cache.
# This step ensures that dependency installation is re-run only if these files change.
# Using 'package*.json' handles both package.json and package-lock.json.
COPY package*.json ./

# Install application dependencies.
# 'npm ci' is preferred for CI/CD and production builds as it installs exact versions
# from package-lock.json, ensuring reproducible builds.
# '--omit=dev' ensures that only production dependencies are installed,
# keeping the final image smaller and more secure.
RUN npm ci --omit=dev

# Stage 2: Production - Create the final lightweight image
# We use an Alpine-based Node.js LTS image for the smallest possible final image size.
# Alpine Linux is known for its minimal footprint, enhancing security and reducing pull times.
FROM node:lts-alpine

# Set the working directory for the application in the final image.
WORKDIR /app

# Set environment variables for the application.
# NODE_ENV=production optimizes Node.js for production usage (e.g., disables development logging).
# PORT specifies the port the application will listen on. This can be customized.
ENV NODE_ENV=production
ENV PORT=3000

# Copy only the necessary files from the builder stage:
# - node_modules: Contains all installed production dependencies.
# - package.json: Useful for inspecting application metadata or scripts in the final image.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy the rest of the application source code into the container.
# This should be done after dependencies to optimize Docker layer caching.
# If your application has a build step (e.g., transpiling TypeScript, bundling React apps),
# you would typically copy the build output (e.g., a 'dist' folder) from the builder stage instead.
# For this JavaScript app, we assume the source files are run directly.
COPY . .

# Expose the port the application listens on.
# This informs Docker that the container listens on the specified network port at runtime.
# It doesn't publish the port, but helps document it. Use '-p' with 'docker run' to publish.
EXPOSE ${PORT}

# Security Best Practice: Create a non-root user and group, then switch to it.
# Running as root inside the container is a security risk.
# 'addgroup --system' and 'adduser --system' create system-level users/groups.
# We create 'appuser' and 'appgroup' to run the application.
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
# Change ownership of the /app directory to the new non-root user.
# This ensures the application has the necessary permissions to read/write within its directory.
RUN chown -R appuser:appgroup /app

# Switch to the non-root user for running the application.
USER appuser

# Define the command to run the application when the container starts.
# This executes the "start" script defined in your package.json, which is "node index.js".
CMD ["npm", "start"]
```