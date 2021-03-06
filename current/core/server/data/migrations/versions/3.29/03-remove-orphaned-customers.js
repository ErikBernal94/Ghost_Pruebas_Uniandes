const logging = require('@tryghost/logging');
const DatabaseInfo = require('@tryghost/database-info');

module.exports = {
    config: {
        transaction: true
    },

    async up({transacting: knex}) {
        if (!DatabaseInfo.isMySQL(knex)) {
            logging.warn('Skipping cleanup of orphaned customers - database is not MySQL');
            return;
        }

        const orphanedCustomers = await knex('members_stripe_customers')
            .select('id')
            .whereNotIn(
                'member_id',
                knex('members')
                    .select('id')
            );

        if (!orphanedCustomers || !orphanedCustomers.length) {
            logging.info('No orphaned customer records found');
            return;
        }

        logging.info(`Deleting ${orphanedCustomers.length} orphaned customers`);
        await knex('members_stripe_customers')
            .whereIn('id', orphanedCustomers.map(customer => customer.id))
            .del();
    },

    async down() {}
};
