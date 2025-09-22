import { MCPClient } from '@mastra/mcp'

export const mapMcpServer = new MCPClient({
  id: "map-mcp-server",
  servers: {
    "amap-maps": {
      "command": "npx",
      "args": [
        "-y",
        "@amap/amap-maps-mcp-server"
      ],
      "env": { "AMAP_MAPS_API_KEY": process.env.AMAP_KEY! }
    }
  },
})
