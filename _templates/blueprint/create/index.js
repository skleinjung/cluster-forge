module.exports = {
  params: ({ args }) => {
    const get = (arg) => {
      if (!args[arg]) {
        throw new Error('Argument "' + arg + '" is required.')
      }
      return args[arg]
    }

    return {
      bootstrapDir: [get('blueprintRoot'), get('name'), 'bootstrap'].join('/'),
    }
  },
}