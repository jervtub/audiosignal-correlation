var ghpages = require('gh-pages');

ghpages.publish(
    'build', // path to public directory
    {
        branch: 'gh-pages',
        repo: 'https://github.com/jervtub/audiosignal-correlation.git', // Update to point to your repository
        user: {
            name: 'jervtub', // update to use your name
            email: 'mail@jervtub.com' // Update to use your email
        }
    },
    () => {
        console.log('Deploy Complete!')
    }
)
