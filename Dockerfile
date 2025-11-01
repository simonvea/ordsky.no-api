FROM node:24-alpine

WORKDIR /app

COPY ./src .
COPY ./*.json ./

RUN npm ci --omit dev

# Create data directory for database volume
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

HEALTHCHECK --interval=5m --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the app
CMD ["node", "index.ts"]

# Volume for database persistence
VOLUME ["/app/data"]
