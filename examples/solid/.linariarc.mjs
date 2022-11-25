module.exports = {
    rules: [
        {
            action: require.resolve('@linaria/shaker'),
        },
        {
            test: /\/node_modules\//,
            action: 'ignore',
        },
        {
            test: (filename, code) => {
                if (!/\/node_modules\//.test(filename)) {
                    return false;
                }

                return /(?:^|\n|;)\s*(?:export|import)\s+/.test(code);
            },
            action: require.resolve('@linaria/shaker'),
        },
    ],
};
