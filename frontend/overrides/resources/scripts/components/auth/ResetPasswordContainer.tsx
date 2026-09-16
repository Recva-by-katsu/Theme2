/**
 * Aurora Theme — reset-password screen. Logic identical to stock.
 */
import React, { useState } from 'react';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import performPasswordReset from '@/api/auth/performPasswordReset';
import { httpErrorToHuman } from '@/api/http';
import LoginFormContainer from '@/components/auth/LoginFormContainer';
import { Actions, useStoreActions } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { Formik, FormikHelpers } from 'formik';
import { object, ref, string } from 'yup';
import { AuroraPasswordField, AuroraInput, FieldLabel } from '@/aurora/components/forms';
import { AuroraButton } from '@/aurora/components/Button';

interface Values {
    password: string;
    passwordConfirmation: string;
}

export default ({ match, location }: RouteComponentProps<{ token: string }>) => {
    const [email, setEmail] = useState('');

    const { clearFlashes, addFlash } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const parsed = new URLSearchParams(location.search);
    if (email.length === 0 && parsed.get('email')) {
        setEmail(parsed.get('email') || '');
    }

    const submit = ({ password, passwordConfirmation }: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes();
        performPasswordReset(email, { token: match.params.token, password, passwordConfirmation })
            .then(() => {
                // @ts-expect-error this is valid
                window.location = '/';
            })
            .catch((error) => {
                console.error(error);

                setSubmitting(false);
                addFlash({ type: 'error', title: 'Error', message: httpErrorToHuman(error) });
            });
    };

    return (
        <Formik
            onSubmit={submit}
            initialValues={{
                password: '',
                passwordConfirmation: '',
            }}
            validationSchema={object().shape({
                password: string()
                    .required('A new password is required.')
                    .min(8, 'Your new password should be at least 8 characters in length.'),
                passwordConfirmation: string()
                    .required('Your new password does not match.')
                    // @ts-expect-error this is valid
                    .oneOf([ref('password'), null], 'Your new password does not match.'),
            })}
        >
            {({ isSubmitting }) => (
                <LoginFormContainer title="Reset Password">
                    <div className="aurora-field">
                        <FieldLabel htmlFor="reset-email">Email</FieldLabel>
                        <AuroraInput id="reset-email" value={email} disabled />
                    </div>
                    <div style={{ marginTop: '1rem' }}>
                        <AuroraPasswordField
                            label="New Password"
                            name="password"
                            description="Passwords must be at least 8 characters in length."
                            autoComplete="new-password"
                        />
                    </div>
                    <div style={{ marginTop: '1rem' }}>
                        <AuroraPasswordField
                            label="Confirm New Password"
                            name="passwordConfirmation"
                            autoComplete="new-password"
                        />
                    </div>
                    <div style={{ marginTop: '1.25rem' }}>
                        <AuroraButton size="xl" block type="submit" disabled={isSubmitting} loading={isSubmitting}>
                            Reset Password
                        </AuroraButton>
                    </div>
                    <Link to="/auth/login" className="aurora-auth-alt">
                        Return to Login
                    </Link>
                </LoginFormContainer>
            )}
        </Formik>
    );
};
